import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_MESSAGE_ATTACHMENT_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { PinnedCommunityMessageRepository } from '../../../domain/repositories/pinned-community-message.repository';
import type { CommunityMessageAttachmentRepository } from '../../../domain/repositories/community-message-attachment.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';
import { CloudinaryService } from '../../../infrastructure/services/cloudinary.service';

export interface DeleteCommunityMessageInput {
  messageId: string;
  userId: string;
}

export interface DeleteCommunityMessageOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class DeleteCommunityMessageUseCase {
  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
    @Inject(PINNED_COMMUNITY_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedCommunityMessageRepository,
    @Inject(COMMUNITY_MESSAGE_ATTACHMENT_REPOSITORY)
    @Optional()
    private readonly communityMessageAttachmentRepository?: CommunityMessageAttachmentRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
    @Optional()
    private readonly cloudinaryService?: CloudinaryService,
  ) {}

  async execute(
    input: DeleteCommunityMessageInput,
  ): Promise<DeleteCommunityMessageOutput> {
    const { messageId, userId } = input;

    // Buscar mensagem
    const message = await this.communityMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'Você só pode excluir suas próprias mensagens',
      );
    }

    // Verificar se está fixada e desfixar
    const isPinned = await this.pinnedMessageRepository.isPinned(messageId);
    if (isPinned) {
      await this.pinnedMessageRepository.unpinMessage(messageId);
    }

    // Deletar arquivos do Cloudinary se houver attachments
    if (this.communityMessageAttachmentRepository) {
      const attachments =
        await this.communityMessageAttachmentRepository.findByMessageId(
          messageId,
        );

      if (attachments.length > 0 && this.cloudinaryService) {
        console.log(
          '[DELETE_COMMUNITY_MESSAGE] 🗑️ Deletando arquivos do Cloudinary...',
          {
            messageId,
            attachmentsCount: attachments.length,
          },
        );

        for (const attachment of attachments) {
          try {
            // Determinar resource type baseado no fileType
            const resourceType = attachment.fileType.startsWith('image/')
              ? 'image'
              : 'raw';

            await this.cloudinaryService.deleteFile(
              attachment.cloudinaryPublicId,
              resourceType,
            );
            console.log(
              '[DELETE_COMMUNITY_MESSAGE] ✅ Arquivo deletado do Cloudinary',
              {
                attachmentId: attachment.id,
                publicId: attachment.cloudinaryPublicId,
              },
            );
          } catch (error) {
            console.error(
              '[DELETE_COMMUNITY_MESSAGE] ❌ Erro ao deletar arquivo do Cloudinary',
              {
                attachmentId: attachment.id,
                publicId: attachment.cloudinaryPublicId,
                error: error.message,
              },
            );
            // Não falhar a exclusão da mensagem se houver erro ao deletar arquivo
          }
        }

        // Deletar attachments do banco (será deletado em cascade, mas vamos garantir)
        await this.communityMessageAttachmentRepository.deleteByMessageId(
          messageId,
        );
      }
    }

    // Soft delete
    await this.communityMessageRepository.delete(messageId);

    // Buscar mensagem atualizada
    const deletedMessage =
      await this.communityMessageRepository.findById(messageId);
    if (!deletedMessage) {
      console.warn(
        '[DELETE_COMMUNITY_MESSAGE] ⚠️ Mensagem não encontrada após soft delete',
        {
          messageId,
        },
      );
    }

    // Notificar todos os membros via WebSocket
    if (this.chatGateway && deletedMessage) {
      // Publicar no Redis para distribuir entre instâncias (isCommunity = true)
      await this.chatGateway.publishMessageDeleted(
        messageId,
        userId,
        deletedMessage.communityId,
        deletedMessage,
        true, // isCommunity
      );
    }

    return {
      success: true,
      message: 'Mensagem excluída com sucesso',
    };
  }
}
