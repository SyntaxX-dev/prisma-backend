import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface EditCommunityMessageInput {
  messageId: string;
  userId: string;
  newContent: string;
}

export interface EditCommunityMessageOutput {
  success: boolean;
  message: {
    id: string;
    communityId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
  };
}

@Injectable()
export class EditCommunityMessageUseCase {
  private readonly EDIT_TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async execute(
    input: EditCommunityMessageInput,
  ): Promise<EditCommunityMessageOutput> {
    const { messageId, userId, newContent } = input;

    // Validar conteúdo
    if (!newContent || newContent.trim().length === 0) {
      throw new BadRequestException(
        'O conteúdo da mensagem não pode estar vazio',
      );
    }

    if (newContent.length > 10000) {
      throw new BadRequestException(
        'O conteúdo da mensagem é muito longo (máximo 10000 caracteres)',
      );
    }

    // Buscar mensagem
    const message = await this.communityMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      throw new ForbiddenException(
        'Você só pode editar suas próprias mensagens',
      );
    }

    // Verificar tempo limite (5 minutos)
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();

    if (messageAge > this.EDIT_TIME_LIMIT_MS) {
      const minutesPassed = Math.floor(messageAge / (60 * 1000));
      throw new BadRequestException(
        `Você só pode editar mensagens enviadas há menos de 5 minutos. Esta mensagem foi enviada há ${minutesPassed} minutos.`,
      );
    }

    // Atualizar mensagem
    const updatedMessage = await this.communityMessageRepository.update(
      messageId,
      newContent.trim(),
    );

    // Notificar todos os membros via WebSocket/Redis em tempo real
    if (this.chatGateway) {
      const community = await this.communityRepository.findById(
        updatedMessage.communityId,
      );
      if (community) {
        // Buscar todos os membros da comunidade
        const members = await this.communityMemberRepository.findByCommunityId(
          updatedMessage.communityId,
        );
        const memberIds = members.map((m) => m.userId);

        // Incluir o dono se não estiver na lista de membros
        if (!memberIds.includes(community.ownerId)) {
          memberIds.push(community.ownerId);
        }

        console.log(
          '[EDIT_COMMUNITY_MESSAGE] 📡 Notificando membros sobre edição...',
          {
            messageId,
            communityId: updatedMessage.communityId,
            senderId: userId,
            totalMembers: memberIds.length,
            timestamp: new Date().toISOString(),
          },
        );

        // Enviar para todos os membros online via WebSocket
        for (const memberId of memberIds) {
          const isOnline = this.chatGateway.isUserOnline(memberId);
          if (isOnline) {
            this.chatGateway.emitToUser(memberId, 'community_message_edited', {
              id: updatedMessage.id,
              communityId: updatedMessage.communityId,
              senderId: updatedMessage.senderId,
              content: updatedMessage.content,
              updatedAt: updatedMessage.updatedAt,
            });
          }
        }

        // Publicar no Redis para outras instâncias do servidor
        await this.chatGateway.publishToRedis({
          type: 'community_message_edited',
          communityId: updatedMessage.communityId,
          messageId: updatedMessage.id,
          senderId: userId,
          receiverIds: memberIds,
          data: {
            id: updatedMessage.id,
            communityId: updatedMessage.communityId,
            senderId: updatedMessage.senderId,
            content: updatedMessage.content,
            updatedAt: updatedMessage.updatedAt,
          },
        });

        console.log(
          '[EDIT_COMMUNITY_MESSAGE] ✅ Notificação de edição enviada',
          {
            messageId,
            communityId: updatedMessage.communityId,
            timestamp: new Date().toISOString(),
          },
        );
      }
    }

    return {
      success: true,
      message: {
        id: updatedMessage.id,
        communityId: updatedMessage.communityId,
        senderId: updatedMessage.senderId,
        content: updatedMessage.content,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
      },
    };
  }
}
