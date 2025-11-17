/**
 * GetMessagesUseCase - Lógica para buscar mensagens entre dois usuários
 * 
 * Este use case busca o histórico de mensagens entre dois usuários,
 * com suporte a paginação.
 */

import { Injectable, Inject, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { MESSAGE_REPOSITORY, FRIENDSHIP_REPOSITORY, USER_REPOSITORY, MESSAGE_ATTACHMENT_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { MessageAttachmentRepository } from '../../../domain/repositories/message-attachment.repository';

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
    edited: boolean; // Se a mensagem foi editada
    attachments?: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      thumbnailUrl: string | null;
      width: number | null;
      height: number | null;
      duration: number | null;
    }>;
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
    @Inject(MESSAGE_ATTACHMENT_REPOSITORY)
    @Optional()
    private readonly messageAttachmentRepository?: MessageAttachmentRepository,
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

    // Buscar attachments para todas as mensagens
    const messagesWithAttachments = await Promise.all(
      messages.map(async (msg) => {
        // Verificar se a mensagem foi editada (tem updatedAt)
        const edited = !!(msg as any).updatedAt;
        
        // Buscar attachments da mensagem
        let attachments: any[] = [];
        if (this.messageAttachmentRepository) {
          const messageAttachments = await this.messageAttachmentRepository.findByMessageId(msg.id);
          attachments = messageAttachments.map((att) => ({
            id: att.id,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileType: att.fileType,
            fileSize: att.fileSize,
            thumbnailUrl: att.thumbnailUrl,
            width: att.width,
            height: att.height,
            duration: att.duration,
          }));
        }
        
        return {
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
          readAt: msg.readAt,
          edited: edited,
          attachments: attachments.length > 0 ? attachments : undefined,
        };
      }),
    );

    return {
      messages: messagesWithAttachments,
      total,
      hasMore,
    };
  }
}

