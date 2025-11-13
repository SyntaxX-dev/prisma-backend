/**
 * GetMessagesUseCase - Lógica para buscar mensagens entre dois usuários
 * 
 * Este use case busca o histórico de mensagens entre dois usuários,
 * com suporte a paginação.
 */

import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { MESSAGE_REPOSITORY, FRIENDSHIP_REPOSITORY, USER_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface GetMessagesInput {
  userId: string; // Usuário que está fazendo a requisição
  friendId: string; // Amigo com quem quer ver as mensagens
  limit?: number;
  offset?: number;
}

export interface GetMessagesOutput {
  messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
  }>;
  total: number;
  hasMore: boolean;
}

@Injectable()
export class GetMessagesUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetMessagesInput): Promise<GetMessagesOutput> {
    const { userId, friendId, limit = 50, offset = 0 } = input;

    // Validações
    if (userId === friendId) {
      throw new BadRequestException('Você não pode buscar mensagens consigo mesmo');
    }

    // Verificar se o amigo existe
    const friend = await this.userRepository.findById(friendId);
    if (!friend) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se são amigos
    const friendship = await this.friendshipRepository.findByUsers(userId, friendId);
    if (!friendship) {
      throw new BadRequestException('Vocês precisam ser amigos para ver as mensagens');
    }

    // Buscar mensagens
    const messages = await this.messageRepository.findByUsers(userId, friendId, limit, offset);

    // Contar total (aproximado, pode ser otimizado)
    const total = messages.length + offset;
    const hasMore = messages.length === limit;

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        readAt: msg.readAt,
      })),
      total,
      hasMore,
    };
  }
}

