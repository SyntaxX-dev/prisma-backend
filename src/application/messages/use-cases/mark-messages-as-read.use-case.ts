/**
 * MarkMessagesAsReadUseCase - Lógica para marcar mensagens como lidas
 * 
 * Quando um usuário abre uma conversa, todas as mensagens não lidas
 * daquele amigo são marcadas como lidas.
 */

import { Injectable, Inject, BadRequestException, Optional } from '@nestjs/common';
import { MESSAGE_REPOSITORY, FRIENDSHIP_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface MarkMessagesAsReadInput {
  userId: string; // Usuário que está marcando como lida
  senderId: string; // Usuário que enviou as mensagens
}

export interface MarkMessagesAsReadOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class MarkMessagesAsReadUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async execute(input: MarkMessagesAsReadInput): Promise<MarkMessagesAsReadOutput> {
    const { userId, senderId } = input;

    // Validações
    if (userId === senderId) {
      throw new BadRequestException('Parâmetros inválidos');
    }

    // Verificar se são amigos
    const friendship = await this.friendshipRepository.findByUsers(userId, senderId);
    if (!friendship) {
      throw new BadRequestException('Vocês precisam ser amigos');
    }

    // Marcar todas as mensagens não lidas como lidas
    await this.messageRepository.markAllAsRead(senderId, userId);

    // Notificar o remetente que suas mensagens foram lidas (se estiver online)
    if (this.chatGateway) {
      this.chatGateway.emitToUser(senderId, 'messages_read', {
        receiverId: userId,
        readAt: new Date(),
      });

      // Publica no Redis para outras instâncias
      await this.chatGateway.publishToRedis({
        type: 'message_read',
        senderId,
        data: {
          receiverId: userId,
          readAt: new Date(),
        },
      });
    }

    return {
      success: true,
      message: 'Mensagens marcadas como lidas',
    };
  }
}

