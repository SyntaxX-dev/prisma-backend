import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  MESSAGE_ATTACHMENT_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
} from '../../../domain/tokens';
import type { MessageAttachmentRepository } from '../../../domain/repositories/message-attachment.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';

export interface GetConversationAttachmentsInput {
  userId: string;
  friendId: string;
}

export interface GetConversationAttachmentsOutput {
  attachments: Array<{
    id: string;
    messageId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    duration: number | null;
    createdAt: Date;
  }>;
  total: number;
}

@Injectable()
export class GetConversationAttachmentsUseCase {
  constructor(
    @Inject(MESSAGE_ATTACHMENT_REPOSITORY)
    @Optional()
    private readonly messageAttachmentRepository?: MessageAttachmentRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    @Optional()
    private readonly friendshipRepository?: FriendshipRepository,
  ) {}

  async execute(
    input: GetConversationAttachmentsInput,
  ): Promise<GetConversationAttachmentsOutput> {
    const { userId, friendId } = input;

    // Verificar se são amigos
    if (this.friendshipRepository) {
      const friendship = await this.friendshipRepository.findByUsers(
        userId,
        friendId,
      );
      if (!friendship) {
        throw new Error('Você não é amigo deste usuário');
      }
    }

    if (!this.messageAttachmentRepository) {
      return { attachments: [], total: 0 };
    }

    // Buscar todos os attachments da conversa
    const attachments =
      await this.messageAttachmentRepository.findByConversation(
        userId,
        friendId,
      );

    return {
      attachments: attachments.map((att) => ({
        id: att.id,
        messageId: att.messageId,
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        thumbnailUrl: att.thumbnailUrl,
        width: att.width,
        height: att.height,
        duration: att.duration,
        createdAt: att.createdAt,
      })),
      total: attachments.length,
    };
  }
}
