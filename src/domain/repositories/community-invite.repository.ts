import { CommunityInvite } from '../entities/community-invite';

export interface CommunityInviteRepository {
  create(invite: CommunityInvite): Promise<CommunityInvite>;
  findById(id: string): Promise<CommunityInvite | null>;
  findByCommunityId(communityId: string): Promise<CommunityInvite[]>;
  findByInviteeUsername(inviteeUsername: string): Promise<CommunityInvite[]>;
  findByCommunityAndInvitee(
    communityId: string,
    inviteeId: string,
  ): Promise<CommunityInvite | null>;
  findByCommunityAndInviteeUsername(
    communityId: string,
    inviteeUsername: string,
  ): Promise<CommunityInvite | null>;
  update(invite: CommunityInvite): Promise<void>;
  delete(id: string): Promise<void>;
}
