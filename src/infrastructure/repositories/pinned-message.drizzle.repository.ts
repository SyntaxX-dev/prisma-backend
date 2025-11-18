import { Injectable } from '@nestjs/common';
import { eq, and, or, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pinnedMessages, messages, users } from '../database/schema';
import type {
  PinnedMessageRepository,
  PinnedMessage,
  PinnedMessageWithDetails,
} from '../../domain/repositories/pinned-message.repository';

@Injectable()
export class PinnedMessageDrizzleRepository implements PinnedMessageRepository {
  constructor(private readonly db: NodePgDatabase) {}

  private mapToEntity(row: any): PinnedMessage {
    return {
      id: row.id,
      messageId: row.messageId,
      pinnedBy: row.pinnedBy,
      userId1: row.userId1,
      userId2: row.userId2,
      pinnedAt: row.pinnedAt,
    };
  }

  async pinMessage(
    messageId: string,
    pinnedBy: string,
    userId1: string,
    userId2: string,
  ): Promise<PinnedMessage> {
    // Garantir que userId1 < userId2 para consistência na busca
    const [u1, u2] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const [result] = await this.db
      .insert(pinnedMessages)
      .values({
        messageId,
        pinnedBy,
        userId1: u1,
        userId2: u2,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async unpinMessage(messageId: string): Promise<void> {
    await this.db
      .delete(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId));
  }

  async findByConversation(
    userId1: string,
    userId2: string,
  ): Promise<PinnedMessageWithDetails[]> {
    // Garantir ordem consistente
    const [u1, u2] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const results = await this.db
      .select({
        pinned: {
          id: pinnedMessages.id,
          messageId: pinnedMessages.messageId,
          pinnedBy: pinnedMessages.pinnedBy,
          userId1: pinnedMessages.userId1,
          userId2: pinnedMessages.userId2,
          pinnedAt: pinnedMessages.pinnedAt,
        },
        message: {
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
        },
        pinnedByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(pinnedMessages)
      .innerJoin(messages, eq(pinnedMessages.messageId, messages.id))
      .innerJoin(users, eq(pinnedMessages.pinnedBy, users.id))
      .where(
        and(eq(pinnedMessages.userId1, u1), eq(pinnedMessages.userId2, u2)),
      )
      .orderBy(desc(pinnedMessages.pinnedAt));

    return results.map((row) => ({
      ...this.mapToEntity(row.pinned),
      message: {
        id: row.message.id,
        senderId: row.message.senderId,
        receiverId: row.message.receiverId,
        content: row.message.content,
        isRead: row.message.isRead === 'true',
        createdAt: row.message.createdAt,
      },
      pinnedByUser: {
        id: row.pinnedByUser.id,
        name: row.pinnedByUser.name,
      },
    }));
  }

  async isPinned(messageId: string): Promise<boolean> {
    const [result] = await this.db
      .select()
      .from(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId))
      .limit(1);

    return !!result;
  }

  async findByMessageId(messageId: string): Promise<PinnedMessage | null> {
    const [result] = await this.db
      .select()
      .from(pinnedMessages)
      .where(eq(pinnedMessages.messageId, messageId))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }
}
