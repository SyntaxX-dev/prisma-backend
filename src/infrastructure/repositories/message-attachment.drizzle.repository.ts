import { eq, or, and, desc } from 'drizzle-orm';
import { messageAttachments, messages } from '../database/schema';
import type { MessageAttachmentRepository } from '../../domain/repositories/message-attachment.repository';
import { MessageAttachment } from '../../domain/entities/message-attachment';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class MessageAttachmentDrizzleRepository
  implements MessageAttachmentRepository
{
  constructor(private readonly db: NodePgDatabase) {}

  async create(attachment: {
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
  }): Promise<MessageAttachment> {
    const [created] = await this.db
      .insert(messageAttachments)
      .values({
        messageId: attachment.messageId,
        fileUrl: attachment.fileUrl,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        cloudinaryPublicId: attachment.cloudinaryPublicId,
        thumbnailUrl: attachment.thumbnailUrl || null,
        width: attachment.width || null,
        height: attachment.height || null,
        duration: attachment.duration || null,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findByMessageId(messageId: string): Promise<MessageAttachment[]> {
    const results = await this.db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));

    return results.map((row) => this.mapToEntity(row));
  }

  async findByConversation(
    userId1: string,
    userId2: string,
  ): Promise<MessageAttachment[]> {
    // Buscar attachments de mensagens entre os dois usuários
    const results = await this.db
      .select({
        id: messageAttachments.id,
        messageId: messageAttachments.messageId,
        fileUrl: messageAttachments.fileUrl,
        fileName: messageAttachments.fileName,
        fileType: messageAttachments.fileType,
        fileSize: messageAttachments.fileSize,
        cloudinaryPublicId: messageAttachments.cloudinaryPublicId,
        thumbnailUrl: messageAttachments.thumbnailUrl,
        width: messageAttachments.width,
        height: messageAttachments.height,
        duration: messageAttachments.duration,
        createdAt: messageAttachments.createdAt,
      })
      .from(messageAttachments)
      .innerJoin(messages, eq(messageAttachments.messageId, messages.id))
      .where(
        and(
          or(
            and(
              eq(messages.senderId, userId1),
              eq(messages.receiverId, userId2),
            ),
            and(
              eq(messages.senderId, userId2),
              eq(messages.receiverId, userId1),
            ),
          ),
          eq(messages.isDeleted, 'false'), // Apenas mensagens não deletadas
        ),
      )
      .orderBy(desc(messageAttachments.createdAt));

    return results.map((row) => this.mapToEntity(row));
  }

  async deleteByMessageId(messageId: string): Promise<void> {
    await this.db
      .delete(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));
  }

  async deleteById(id: string): Promise<void> {
    await this.db
      .delete(messageAttachments)
      .where(eq(messageAttachments.id, id));
  }

  private mapToEntity(row: any): MessageAttachment {
    return new MessageAttachment(
      row.id,
      row.messageId,
      row.fileUrl,
      row.fileName,
      row.fileType,
      row.fileSize,
      row.cloudinaryPublicId,
      row.thumbnailUrl,
      row.width,
      row.height,
      row.duration,
      row.createdAt,
    );
  }
}
