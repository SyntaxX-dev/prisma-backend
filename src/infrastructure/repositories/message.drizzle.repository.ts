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

  async countUnreadByConversation(receiverId: string, senderId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, receiverId),
          eq(messages.senderId, senderId),
          eq(messages.isRead, 'false'),
        ),
      );

    return result?.count || 0;
  }

  async findConversations(userId: string): Promise<Array<{
    otherUserId: string;
    lastMessage: Message;
    unreadCount: number;
  }>> {
    // Buscar todas as mensagens do usuário ordenadas por data
    const allMessages = await this.db
      .select()
      .from(messages)
      .where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
      )
      .orderBy(desc(messages.createdAt));

    // Buscar contagem de não lidas agrupadas por sender
    const unreadCounts = await this.db
      .select({
        senderId: messages.senderId,
        count: count(),
      })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, 'false'),
        ),
      )
      .groupBy(messages.senderId);

    // Criar mapa de contagens não lidas
    const unreadCountMap = new Map<string, number>();
    for (const item of unreadCounts) {
      unreadCountMap.set(item.senderId, item.count);
    }

    // Agrupar por par de usuários e pegar a última mensagem de cada conversa
    const conversationsMap = new Map<string, {
      otherUserId: string;
      lastMessage: Message;
    }>();

    for (const msg of allMessages) {
      // Determinar qual é o outro usuário
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      // Se já não temos uma conversa com esse usuário, adicionar
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUserId,
          lastMessage: this.mapToEntity(msg),
        });
      }
    }

    // Montar resultado final com contagens
    const conversations = Array.from(conversationsMap.values()).map((conv) => {
      const unreadCount = unreadCountMap.get(conv.otherUserId) || 0;
      return {
        otherUserId: conv.otherUserId,
        lastMessage: conv.lastMessage,
        unreadCount,
      };
    });

    // Ordenar por data da última mensagem (mais recentes primeiro)
    conversations.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );

    return conversations;
  }

  async update(messageId: string, content: string): Promise<Message> {
    await this.db
      .update(messages)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    const updated = await this.findById(messageId);
    if (!updated) {
      throw new Error('Mensagem não encontrada após atualização');
    }

    return updated;
  }

  async delete(messageId: string): Promise<void> {
    // Soft delete: marca como deletada e substitui conteúdo por "Mensagem apagada"
    await this.db
      .update(messages)
      .set({
        content: 'Mensagem apagada',
        isDeleted: 'true',
        deletedAt: new Date(),
      })
      .where(eq(messages.id, messageId));
  }

  private mapToEntity(row: any): Message & { updatedAt?: Date | null; isDeleted?: boolean } {
    const message = new Message(
      row.id,
      row.senderId,
      row.receiverId,
      row.content, // Já vem como "Mensagem apagada" se foi deletada
      row.isRead === 'true',
      row.createdAt,
      row.readAt,
    );
    // Adicionar updatedAt se existir
    if (row.updatedAt) {
      (message as any).updatedAt = row.updatedAt;
    }
    // Adicionar isDeleted se existir
    if (row.isDeleted) {
      (message as any).isDeleted = row.isDeleted === 'true';
    }
    return message as Message & { updatedAt?: Date | null; isDeleted?: boolean };
  }
}

