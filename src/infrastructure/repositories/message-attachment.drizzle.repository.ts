import { eq } from 'drizzle-orm';
import { messageAttachments } from '../database/schema';
import type { MessageAttachmentRepository } from '../../domain/repositories/message-attachment.repository';
import { MessageAttachment } from '../../domain/entities/message-attachment';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class MessageAttachmentDrizzleRepository implements MessageAttachmentRepository {
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

  async deleteByMessageId(messageId: string): Promise<void> {
    await this.db.delete(messageAttachments).where(eq(messageAttachments.messageId, messageId));
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(messageAttachments).where(eq(messageAttachments.id, id));
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

