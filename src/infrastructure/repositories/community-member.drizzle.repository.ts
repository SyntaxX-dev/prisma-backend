import { eq, and, count } from 'drizzle-orm';
import { communityMembers } from '../database/schema';
import type { CommunityMemberRepository } from '../../domain/repositories/community-member.repository';
import { CommunityMember } from '../../domain/entities/community-member';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class CommunityMemberDrizzleRepository
  implements CommunityMemberRepository
{
  constructor(private readonly db: NodePgDatabase) {}

  async create(member: CommunityMember): Promise<CommunityMember> {
    const [created] = await this.db
      .insert(communityMembers)
      .values({
        id: member.id,
        communityId: member.communityId,
        userId: member.userId,
        joinedAt: member.joinedAt,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findByCommunityId(communityId: string): Promise<CommunityMember[]> {
    const results = await this.db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId))
      .orderBy(communityMembers.joinedAt);

    return results.map((m) => this.mapToEntity(m));
  }

  async findByUserId(userId: string): Promise<CommunityMember[]> {
    const results = await this.db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId))
      .orderBy(communityMembers.joinedAt);

    return results.map((m) => this.mapToEntity(m));
  }

  async findByCommunityAndUser(
    communityId: string,
    userId: string,
  ): Promise<CommunityMember | null> {
    const [member] = await this.db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId),
        ),
      );

    if (!member) return null;

    return this.mapToEntity(member);
  }

  async delete(communityId: string, userId: string): Promise<void> {
    await this.db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId),
        ),
      );
  }

  async countMembersByCommunityId(communityId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));

    return result.count;
  }

  private mapToEntity(row: any): CommunityMember {
    return new CommunityMember(
      row.id,
      row.communityId,
      row.userId,
      new Date(row.joinedAt),
    );
  }
}
