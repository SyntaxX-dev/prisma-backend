import { eq, and } from 'drizzle-orm';
import { communityInvites } from '../database/schema';
import type { CommunityInviteRepository } from '../../domain/repositories/community-invite.repository';
import type { CommunityInvite } from '../../domain/entities/community-invite';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class CommunityInviteDrizzleRepository
  implements CommunityInviteRepository
{
  constructor(private readonly db: NodePgDatabase) {}

  async create(invite: CommunityInvite): Promise<CommunityInvite> {
    const [created] = await this.db
      .insert(communityInvites)
      .values({
        id: invite.id,
        communityId: invite.communityId,
        inviterId: invite.inviterId,
        inviteeUsername: invite.inviteeUsername,
        inviteeId: invite.inviteeId,
        status: invite.status,
        createdAt: invite.createdAt,
        updatedAt: invite.updatedAt,
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<CommunityInvite | null> {
    const [invite] = await this.db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.id, id));

    if (!invite) return null;

    return this.mapToEntity(invite);
  }

  async findByCommunityId(communityId: string): Promise<CommunityInvite[]> {
    const results = await this.db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.communityId, communityId))
      .orderBy(communityInvites.createdAt);

    return results.map((i) => this.mapToEntity(i));
  }

  async findByInviteeUsername(
    inviteeUsername: string,
  ): Promise<CommunityInvite[]> {
    const results = await this.db
      .select()
      .from(communityInvites)
      .where(eq(communityInvites.inviteeUsername, inviteeUsername))
      .orderBy(communityInvites.createdAt);

    return results.map((i) => this.mapToEntity(i));
  }

  async findByCommunityAndInvitee(
    communityId: string,
    inviteeId: string,
  ): Promise<CommunityInvite | null> {
    const [invite] = await this.db
      .select()
      .from(communityInvites)
      .where(
        and(
          eq(communityInvites.communityId, communityId),
          eq(communityInvites.inviteeId, inviteeId),
        ),
      );

    if (!invite) return null;

    return this.mapToEntity(invite);
  }

  async findByCommunityAndInviteeUsername(
    communityId: string,
    inviteeUsername: string,
  ): Promise<CommunityInvite | null> {
    const [invite] = await this.db
      .select()
      .from(communityInvites)
      .where(
        and(
          eq(communityInvites.communityId, communityId),
          eq(communityInvites.inviteeUsername, inviteeUsername),
        ),
      );

    if (!invite) return null;

    return this.mapToEntity(invite);
  }

  async update(invite: CommunityInvite): Promise<void> {
    await this.db
      .update(communityInvites)
      .set({
        status: invite.status,
        inviteeId: invite.inviteeId,
        updatedAt: new Date(),
      })
      .where(eq(communityInvites.id, invite.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(communityInvites).where(eq(communityInvites.id, id));
  }

  private mapToEntity(row: any): CommunityInvite {
    return new CommunityInvite(
      row.id,
      row.communityId,
      row.inviterId,
      row.inviteeUsername,
      row.inviteeId,
      row.status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
      new Date(row.createdAt),
      new Date(row.updatedAt),
    );
  }
}

