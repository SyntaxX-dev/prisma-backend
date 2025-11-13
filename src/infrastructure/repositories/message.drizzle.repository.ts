import { eq, and, or, desc, count, sql } from 'drizzle-orm';
import { messages } from '../database/schema';
import type { MessageRepository } from '../../domain/repositories/message.repository';
import { Message } from '../../domain/entities/message';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * MessageDrizzleRepository - Implementação do repositório de mensagens usando Drizzle ORM
 * 
 * Este repositório implementa a interface MessageRepository usando Drizzle ORM
 * para acessar a tabela messages no PostgreSQL.
 */
export class MessageDrizzleRepository implements MessageRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(senderId: string, receiverId: string, content: string): Promise<Message> {
    const [created] = await this.db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        content,
        isRead: 'false',
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Message | null> {
    const [found] = await this.db.select().from(messages).where(eq(messages.id, id)).limit(1);

    if (!found) return null;

    return this.mapToEntity(found);
  }

  async findByUsers(
    userId1: string,
    userId2: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const results = await this.db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1)),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((row) => this.mapToEntity(row)).reverse(); // Reverter para ordem cronológica
  }

  async findUnreadByReceiverId(receiverId: string): Promise<Message[]> {
    const results = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.receiverId, receiverId), eq(messages.isRead, 'false')))
      .orderBy(desc(messages.createdAt));

    return results.map((row) => this.mapToEntity(row));
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.db
      .update(messages)
      .set({
        isRead: 'true',
        readAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  async markAllAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.db
      .update(messages)
      .set({
        isRead: 'true',
        readAt: new Date(),
      })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.isRead, 'false'),
        ),
      );
  }

  async countUnread(receiverId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(messages)
      .where(and(eq(messages.receiverId, receiverId), eq(messages.isRead, 'false')));

    return result?.count || 0;
  }

  private mapToEntity(row: any): Message {
    return new Message(
      row.id,
      row.senderId,
      row.receiverId,
      row.content,
      row.isRead === 'true',
      row.createdAt,
      row.readAt,
    );
  }
}

