import { eq, and } from 'drizzle-orm';
import { blocks } from '../database/schema';
import type { BlockRepository } from '../../domain/repositories/block.repository';
import { Block } from '../../domain/entities/block';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class BlockDrizzleRepository implements BlockRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(blockerId: string, blockedId: string): Promise<Block> {
    const [created] = await this.db
      .insert(blocks)
      .values({
        blockerId,
        blockedId,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Block | null> {
    const [block] = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.id, id));

    if (!block) return null;

    return this.mapToEntity(block);
  }

  async findByBlockerAndBlocked(
    blockerId: string,
    blockedId: string,
  ): Promise<Block | null> {
    const [block] = await this.db
      .select()
      .from(blocks)
      .where(
        and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)),
      );

    if (!block) return null;

    return this.mapToEntity(block);
  }

  async findByBlockerId(blockerId: string): Promise<Block[]> {
    const allBlocks = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.blockerId, blockerId))
      .orderBy(blocks.createdAt);

    return allBlocks.map((b) => this.mapToEntity(b));
  }

  async findByBlockedId(blockedId: string): Promise<Block[]> {
    const allBlocks = await this.db
      .select()
      .from(blocks)
      .where(eq(blocks.blockedId, blockedId))
      .orderBy(blocks.createdAt);

    return allBlocks.map((b) => this.mapToEntity(b));
  }

  async delete(blockerId: string, blockedId: string): Promise<void> {
    await this.db
      .delete(blocks)
      .where(
        and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)),
      );
  }

  private mapToEntity(row: any): Block {
    return new Block(row.id, row.blockerId, row.blockedId, row.createdAt);
  }
}
