import { CommunityVisibility } from '../enums/community-visibility';

export class Community {
  constructor(
    public readonly id: string,
    public name: string,
    public focus: string,
    public description: string | null,
    public image: string | null,
    public visibility: CommunityVisibility,
    public ownerId: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}

