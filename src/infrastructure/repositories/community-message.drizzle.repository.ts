import { eq, desc, count } from 'drizzle-orm';
import { communityMessages } from '../database/schema';
import type { CommunityMessageRepository } from '../../domain/repositories/community-message.repository';
import { CommunityMessage } from '../../domain/entities/community-message';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * CommunityMessageDrizzleRepository - Implementação do repositório de mensagens de comunidades usando Drizzle ORM
 *
 * Este repositório implementa a interface CommunityMessageRepository usando Drizzle ORM
 * para acessar a tabela community_messages no PostgreSQL.
 */
export class CommunityMessageDrizzleRepository
  implements CommunityMessageRepository
{
  constructor(private readonly db: NodePgDatabase) {}

  async create(
    communityId: string,
    senderId: string,
    content: string,
  ): Promise<CommunityMessage> {
    const [created] = await this.db
      .insert(communityMessages)
      .values({
        communityId,
        senderId,
        content,
        isDeleted: 'false',
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<CommunityMessage | null> {
    const [found] = await this.db
      .select()
      .from(communityMessages)
      .where(eq(communityMessages.id, id))
      .limit(1);

    if (!found) return null;

    return this.mapToEntity(found);
  }

  async findByCommunity(
    communityId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CommunityMessage[]> {
    const results = await this.db
      .select()
      .from(communityMessages)
      .where(eq(communityMessages.communityId, communityId))
      .orderBy(desc(communityMessages.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map((row) => this.mapToEntity(row)).reverse(); // Reverter para ordem cronológica
  }

  async countByCommunity(communityId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(communityMessages)
      .where(eq(communityMessages.communityId, communityId));

    return result.count;
  }

  async update(messageId: string, content: string): Promise<CommunityMessage> {
    await this.db
      .update(communityMessages)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(communityMessages.id, messageId));

    const updated = await this.findById(messageId);
    if (!updated) {
      throw new Error('Mensagem não encontrada após atualização');
    }

    return updated;
  }

  async delete(messageId: string): Promise<void> {
    // Soft delete: marca como deletada e substitui conteúdo por "Mensagem apagada"
    await this.db
      .update(communityMessages)
      .set({
        content: 'Mensagem apagada',
        isDeleted: 'true',
        deletedAt: new Date(),
      })
      .where(eq(communityMessages.id, messageId));
  }

  private mapToEntity(row: any): CommunityMessage {
    const message = new CommunityMessage(
      row.id,
      row.communityId,
      row.senderId,
      row.content, // Já vem como "Mensagem apagada" se foi deletada
      row.createdAt,
      row.updatedAt || null,
      row.isDeleted === 'true',
      row.deletedAt || null,
    );
    return message;
  }
}
