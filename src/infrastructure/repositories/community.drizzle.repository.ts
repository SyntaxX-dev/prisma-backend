import { eq, and, or } from 'drizzle-orm';
import { communities, communityMembers } from '../database/schema';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import { Community } from '../../domain/entities/community';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CommunityVisibility } from '../../domain/enums/community-visibility';

export class CommunityDrizzleRepository implements CommunityRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(community: Community): Promise<Community> {
    const [created] = await this.db
      .insert(communities)
      .values({
        id: community.id,
        name: community.name,
        focus: community.focus,
        description: community.description,
        image: community.image,
        visibility: community.visibility,
        ownerId: community.ownerId,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Community | null> {
    const [community] = await this.db
      .select()
      .from(communities)
      .where(eq(communities.id, id));

    if (!community) return null;

    return this.mapToEntity(community);
  }

  async findByName(name: string): Promise<Community | null> {
    const [community] = await this.db
      .select()
      .from(communities)
      .where(eq(communities.name, name));

    if (!community) return null;

    return this.mapToEntity(community);
  }

  async findByOwnerId(ownerId: string): Promise<Community[]> {
    const results = await this.db
      .select()
      .from(communities)
      .where(eq(communities.ownerId, ownerId))
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async findPublicCommunities(): Promise<Community[]> {
    const results = await this.db
      .select()
      .from(communities)
      .where(eq(communities.visibility, 'PUBLIC'))
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async findPublicCommunitiesByFocus(focus: string): Promise<Community[]> {
    const results = await this.db
      .select()
      .from(communities)
      .where(
        and(eq(communities.visibility, 'PUBLIC'), eq(communities.focus, focus)),
      )
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async findCommunitiesByUserId(userId: string): Promise<Community[]> {
    const results = await this.db
      .select({
        id: communities.id,
        name: communities.name,
        focus: communities.focus,
        description: communities.description,
        image: communities.image,
        visibility: communities.visibility,
        ownerId: communities.ownerId,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
      })
      .from(communities)
      .innerJoin(
        communityMembers,
        eq(communityMembers.communityId, communities.id),
      )
      .where(eq(communityMembers.userId, userId))
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async findPublicAndOwnedCommunities(userId: string): Promise<Community[]> {
    const results = await this.db
      .select()
      .from(communities)
      .where(
        or(
          eq(communities.visibility, 'PUBLIC'),
          and(
            eq(communities.visibility, 'PRIVATE'),
            eq(communities.ownerId, userId),
          ),
        ),
      )
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async findPublicAndOwnedCommunitiesByFocus(
    userId: string,
    focus: string,
  ): Promise<Community[]> {
    const results = await this.db
      .select()
      .from(communities)
      .where(
        and(
          eq(communities.focus, focus),
          or(
            eq(communities.visibility, 'PUBLIC'),
            and(
              eq(communities.visibility, 'PRIVATE'),
              eq(communities.ownerId, userId),
            ),
          ),
        ),
      )
      .orderBy(communities.createdAt);

    return results.map((c) => this.mapToEntity(c));
  }

  async update(community: Community): Promise<void> {
    await this.db
      .update(communities)
      .set({
        name: community.name,
        focus: community.focus,
        description: community.description,
        image: community.image,
        visibility: community.visibility,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, community.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(communities).where(eq(communities.id, id));
  }

  private mapToEntity(row: any): Community {
    return new Community(
      row.id,
      row.name,
      row.focus,
      row.description,
      row.image,
      row.visibility as CommunityVisibility,
      row.ownerId,
      new Date(row.createdAt),
      new Date(row.updatedAt),
    );
  }
}
