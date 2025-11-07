export class CommunityMember {
  constructor(
    public readonly id: string,
    public communityId: string,
    public userId: string,
    public readonly joinedAt: Date = new Date(),
  ) {}
}

