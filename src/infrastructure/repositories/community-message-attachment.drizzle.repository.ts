import { eq } from 'drizzle-orm';
import { communityMessageAttachments } from '../database/schema';
import type { CommunityMessageAttachmentRepository } from '../../domain/repositories/community-message-attachment.repository';
import { CommunityMessageAttachment } from '../../domain/entities/community-message-attachment';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class CommunityMessageAttachmentDrizzleRepository
  implements CommunityMessageAttachmentRepository
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
  }): Promise<CommunityMessageAttachment> {
    const [created] = await this.db
      .insert(communityMessageAttachments)
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

  async findByMessageId(messageId: string): Promise<CommunityMessageAttachment[]> {
    const results = await this.db
      .select()
      .from(communityMessageAttachments)
      .where(eq(communityMessageAttachments.messageId, messageId));

    return results.map((row) => this.mapToEntity(row));
  }

  async deleteByMessageId(messageId: string): Promise<void> {
    await this.db
      .delete(communityMessageAttachments)
      .where(eq(communityMessageAttachments.messageId, messageId));
  }

  async deleteById(id: string): Promise<void> {
    await this.db
      .delete(communityMessageAttachments)
      .where(eq(communityMessageAttachments.id, id));
  }

  private mapToEntity(row: any): CommunityMessageAttachment {
    return new CommunityMessageAttachment(
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

