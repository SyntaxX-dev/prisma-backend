import { MessageAttachment } from '../entities/message-attachment';

export interface MessageAttachmentRepository {
  create(attachment: {
    messageId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    cloudinaryPublicId: string;
    thumbnailUrl?: string | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }): Promise<MessageAttachment>;
  findByMessageId(messageId: string): Promise<MessageAttachment[]>;
  findByConversation(userId1: string, userId2: string): Promise<MessageAttachment[]>;
  deleteByMessageId(messageId: string): Promise<void>;
  deleteById(id: string): Promise<void>;
}

