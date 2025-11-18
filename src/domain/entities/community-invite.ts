export class CommunityInvite {
  constructor(
    public readonly id: string,
    public communityId: string,
    public inviterId: string,
    public inviteeUsername: string,
    public inviteeId: string | null,
    public status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
