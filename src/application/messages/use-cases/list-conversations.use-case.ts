/**
 * ListConversationsUseCase - Lógica para listar todas as conversas de um usuário
 * 
 * Este use case retorna todas as conversas do usuário com:
 * - Última mensagem de cada conversa
 * - Contagem de mensagens não lidas
 * - Informações do outro usuário
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MESSAGE_REPOSITORY, USER_REPOSITORY, FRIENDSHIP_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';

export interface ListConversationsInput {
  userId: string;
}

export interface ConversationOutput {
  otherUser: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    createdAt: Date;
    readAt: Date | null;
    edited: boolean; // Se a mensagem foi editada
  };
  unreadCount: number;
  isFromMe: boolean; // Se a última mensagem foi enviada por mim
}

export interface ListConversationsOutput {
  conversations: ConversationOutput[];
  total: number;
}

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
  ) {}

  async execute(input: ListConversationsInput): Promise<ListConversationsOutput> {
    const { userId } = input;

    // Verificar se o usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar todas as conversas
    const conversationsData = await this.messageRepository.findConversations(userId);

    // Enriquecer com informações dos outros usuários
    const enrichedConversations = await Promise.all(
      conversationsData.map(async (conv) => {
        // Buscar informações do outro usuário
        const otherUser = await this.userRepository.findById(conv.otherUserId);
        if (!otherUser) {
          return null;
        }

        // Verificar se ainda são amigos (opcional, mas recomendado)
        const friendship = await this.friendshipRepository.findByUsers(
          userId,
          conv.otherUserId,
        );
        if (!friendship) {
          return null; // Não mostrar conversas com usuários que não são mais amigos
        }

        // Verificar se a mensagem foi editada (tem updatedAt)
        const edited = !!(conv.lastMessage as any).updatedAt;

        return {
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profileImage: otherUser.profileImage || null,
          },
          lastMessage: {
            id: conv.lastMessage.id,
            content: conv.lastMessage.content,
            senderId: conv.lastMessage.senderId,
            receiverId: conv.lastMessage.receiverId,
            isRead: conv.lastMessage.isRead,
            createdAt: conv.lastMessage.createdAt,
            readAt: conv.lastMessage.readAt,
            edited: edited,
          },
          unreadCount: conv.unreadCount,
          isFromMe: conv.lastMessage.senderId === userId,
        } as ConversationOutput;
      }),
    );

    // Filtrar conversas nulas (usuários que não existem mais ou não são mais amigos)
    const validConversations = enrichedConversations.filter(
      (conv): conv is ConversationOutput => conv !== null,
    );

    return {
      conversations: validConversations,
      total: validConversations.length,
    };
  }
}

