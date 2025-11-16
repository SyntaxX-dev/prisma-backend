import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { pinnedCommunityMessages, communityMessages, users } from '../database/schema';
import type {
  PinnedCommunityMessageRepository,
  PinnedCommunityMessage,
  PinnedCommunityMessageWithDetails,
} from '../../domain/repositories/pinned-community-message.repository';
import { CommunityMessage } from '../../domain/entities/community-message';

@Injectable()
export class PinnedCommunityMessageDrizzleRepository implements PinnedCommunityMessageRepository {
  constructor(private readonly db: NodePgDatabase) {}

  private mapToEntity(row: any): PinnedCommunityMessage {
    return {
      id: row.id,
      messageId: row.messageId,
      communityId: row.communityId,
      pinnedBy: row.pinnedBy,
      pinnedAt: row.pinnedAt,
    };
  }

  async pinMessage(
    messageId: string,
    communityId: string,
    pinnedBy: string,
  ): Promise<PinnedCommunityMessage> {
    const [result] = await this.db
      .insert(pinnedCommunityMessages)
      .values({
        messageId,
        communityId,
        pinnedBy,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async unpinMessage(messageId: string): Promise<void> {
    await this.db
      .delete(pinnedCommunityMessages)
      .where(eq(pinnedCommunityMessages.messageId, messageId));
  }

  async findByCommunity(communityId: string): Promise<PinnedCommunityMessageWithDetails[]> {
    const results = await this.db
      .select({
        pinned: {
          id: pinnedCommunityMessages.id,
          messageId: pinnedCommunityMessages.messageId,
          communityId: pinnedCommunityMessages.communityId,
          pinnedBy: pinnedCommunityMessages.pinnedBy,
          pinnedAt: pinnedCommunityMessages.pinnedAt,
        },
        message: {
          id: communityMessages.id,
          communityId: communityMessages.communityId,
          senderId: communityMessages.senderId,
          content: communityMessages.content,
          createdAt: communityMessages.createdAt,
        },
        pinnedByUser: {
          id: users.id,
          name: users.name,
        },
      })
      .from(pinnedCommunityMessages)
      .innerJoin(communityMessages, eq(pinnedCommunityMessages.messageId, communityMessages.id))
      .innerJoin(users, eq(pinnedCommunityMessages.pinnedBy, users.id))
      .where(eq(pinnedCommunityMessages.communityId, communityId))
      .orderBy(desc(pinnedCommunityMessages.pinnedAt));

    return results.map((row) => ({
      ...this.mapToEntity(row.pinned),
      message: {
        id: row.message.id,
        communityId: row.message.communityId,
        senderId: row.message.senderId,
        content: row.message.content,
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
      .from(pinnedCommunityMessages)
      .where(eq(pinnedCommunityMessages.messageId, messageId))
      .limit(1);
    return !!result;
  }

  async findByMessageId(messageId: string): Promise<PinnedCommunityMessage | null> {
    const [result] = await this.db
      .select()
      .from(pinnedCommunityMessages)
      .where(eq(pinnedCommunityMessages.messageId, messageId))
      .limit(1);
    return result ? this.mapToEntity(result) : null;
  }
}

