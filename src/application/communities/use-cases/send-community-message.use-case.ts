/**
 * SendCommunityMessageUseCase - Lógica para enviar uma mensagem em uma comunidade
 * 
 * Este use case segue o padrão usado por WhatsApp, Telegram, Discord para grupos:
 * 1. Valida se o usuário é membro da comunidade
 * 2. Salva a mensagem no banco de dados (fonte da verdade)
 * 3. Envia via WebSocket + Redis para todos os membros online
 * 4. Envia Push Notification para membros offline
 */

import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  USER_REPOSITORY,
  PUSH_NOTIFICATION_SERVICE,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PushNotificationService } from '../../../domain/services/push-notification.service';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface SendCommunityMessageInput {
  communityId: string;
  senderId: string;
  content: string;
}

export interface SendCommunityMessageOutput {
  success: boolean;
  message: {
    id: string;
    communityId: string;
    senderId: string;
    content: string;
    createdAt: Date;
  };
}

@Injectable()
export class SendCommunityMessageUseCase {
  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
    @Inject(PUSH_NOTIFICATION_SERVICE)
    @Optional()
    private readonly pushNotificationService?: PushNotificationService,
  ) {}

  async execute(input: SendCommunityMessageInput): Promise<SendCommunityMessageOutput> {
    const { communityId, senderId, content } = input;

    // Validações
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Mensagem não pode estar vazia');
    }

    if (content.length > 5000) {
      throw new BadRequestException('Mensagem muito longa (máximo 5000 caracteres)');
    }

    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o usuário é membro da comunidade (ou é o dono)
    const isOwner = community.ownerId === senderId;
    const member = await this.communityMemberRepository.findByCommunityAndUser(
      communityId,
      senderId,
    );

    if (!isOwner && !member) {
      throw new ForbiddenException('Você precisa ser membro da comunidade para enviar mensagens');
    }

    // Criar mensagem no banco de dados (FONTE DA VERDADE)
    const message = await this.communityMessageRepository.create(communityId, senderId, content);

    console.log('[SEND_COMMUNITY_MESSAGE] 💾 Mensagem salva no banco de dados', {
      messageId: message.id,
      communityId,
      senderId,
      timestamp: new Date().toISOString(),
    });

    // Buscar todos os membros da comunidade
    const members = await this.communityMemberRepository.findByCommunityId(communityId);
    const memberIds = members.map((m) => m.userId);
    
    // Incluir o dono se não estiver na lista de membros
    if (!memberIds.includes(community.ownerId)) {
      memberIds.push(community.ownerId);
    }

    // Remover o sender da lista (não precisa receber sua própria mensagem)
    const receiverIds = memberIds.filter((id) => id !== senderId);

    console.log('[SEND_COMMUNITY_MESSAGE] 📡 Enviando mensagem para membros...', {
      communityId,
      senderId,
      totalMembers: memberIds.length,
      receivers: receiverIds.length,
      timestamp: new Date().toISOString(),
    });

    // Enviar para todos os membros online via WebSocket
    if (this.chatGateway) {
      let onlineCount = 0;
      let offlineCount = 0;

      for (const receiverId of receiverIds) {
        const isOnline = this.chatGateway.isUserOnline(receiverId);

        if (isOnline) {
          // Enviar via WebSocket
          this.chatGateway.emitToUser(receiverId, 'new_community_message', {
            id: message.id,
            communityId: message.communityId,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
          });
          onlineCount++;
        } else {
          // Enviar push notification para offline
          if (this.pushNotificationService) {
            const sender = await this.userRepository.findById(senderId);
            const senderName = sender?.name || 'Alguém';

            await this.pushNotificationService.sendNotification(
              receiverId,
              `Nova mensagem em ${community.name}`,
              content.length > 100 ? content.substring(0, 100) + '...' : content,
              {
                type: 'new_community_message',
                messageId: message.id,
                communityId: communityId,
                senderId: message.senderId,
              },
            );
          }
          offlineCount++;
        }
      }

      // Publicar no Redis para outras instâncias do servidor
      await this.chatGateway.publishToRedis({
        type: 'new_community_message',
        communityId: message.communityId,
        receiverIds: receiverIds,
        data: {
          id: message.id,
          communityId: message.communityId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        },
      });

      console.log('[SEND_COMMUNITY_MESSAGE] ✅ Mensagem distribuída', {
        communityId,
        onlineCount,
        offlineCount,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: {
        id: message.id,
        communityId: message.communityId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      },
    };
  }
}

