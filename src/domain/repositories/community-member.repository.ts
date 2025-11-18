import { CommunityMember } from '../entities/community-member';

export interface CommunityMemberRepository {
  create(member: CommunityMember): Promise<CommunityMember>;
  findByCommunityId(communityId: string): Promise<CommunityMember[]>;
  findByUserId(userId: string): Promise<CommunityMember[]>;
  findByCommunityAndUser(
    communityId: string,
    userId: string,
  ): Promise<CommunityMember | null>;
  delete(communityId: string, userId: string): Promise<void>;
  countMembersByCommunityId(communityId: string): Promise<number>;
}
