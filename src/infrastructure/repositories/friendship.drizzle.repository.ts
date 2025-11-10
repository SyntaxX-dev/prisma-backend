import { eq, and, or } from 'drizzle-orm';
import { friendships } from '../database/schema';
import type { FriendshipRepository } from '../../domain/repositories/friendship.repository';
import { Friendship } from '../../domain/entities/friendship';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class FriendshipDrizzleRepository implements FriendshipRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(userId1: string, userId2: string): Promise<Friendship> {
    // Garantir que userId1 < userId2 para consistência
    const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const [created] = await this.db
      .insert(friendships)
      .values({
        userId1: id1,
        userId2: id2,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Friendship | null> {
    const [friendship] = await this.db
      .select()
      .from(friendships)
      .where(eq(friendships.id, id));

    if (!friendship) return null;

    return this.mapToEntity(friendship);
  }

  async findByUsers(userId1: string, userId2: string): Promise<Friendship | null> {
    // Garantir que userId1 < userId2 para consistência
    const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const [friendship] = await this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)));

    if (!friendship) return null;

    return this.mapToEntity(friendship);
  }

  async findByUserId(userId: string): Promise<Friendship[]> {
    const allFriendships = await this.db
      .select()
      .from(friendships)
      .where(or(eq(friendships.userId1, userId), eq(friendships.userId2, userId)))
      .orderBy(friendships.createdAt);

    return allFriendships.map((f) => this.mapToEntity(f));
  }

  async delete(userId1: string, userId2: string): Promise<void> {
    // Garantir que userId1 < userId2 para consistência
    const [id1, id2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    await this.db
      .delete(friendships)
      .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)));
  }

  private mapToEntity(row: any): Friendship {
    return new Friendship(row.id, row.userId1, row.userId2, row.createdAt);
  }
}

