import { Injectable, Inject, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { PinnedCommunityMessageRepository } from '../../../domain/repositories/pinned-community-message.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

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
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async execute(input: DeleteCommunityMessageInput): Promise<DeleteCommunityMessageOutput> {
    const { messageId, userId } = input;

    // Buscar mensagem
    const message = await this.communityMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      throw new ForbiddenException('Você só pode excluir suas próprias mensagens');
    }

    // Verificar se está fixada e desfixar
    const isPinned = await this.pinnedMessageRepository.isPinned(messageId);
    if (isPinned) {
      await this.pinnedMessageRepository.unpinMessage(messageId);
    }

    // Soft delete
    await this.communityMessageRepository.delete(messageId);

    // Buscar mensagem atualizada
    const deletedMessage = await this.communityMessageRepository.findById(messageId);
    if (!deletedMessage) {
      console.warn('[DELETE_COMMUNITY_MESSAGE] ⚠️ Mensagem não encontrada após soft delete', {
        messageId,
      });
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

