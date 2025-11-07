import { Community } from '../entities/community';
import { CommunityVisibility } from '../enums/community-visibility';

export interface CommunityRepository {
  create(community: Community): Promise<Community>;
  findById(id: string): Promise<Community | null>;
  findByName(name: string): Promise<Community | null>;
  findByOwnerId(ownerId: string): Promise<Community[]>;
  findPublicCommunities(): Promise<Community[]>;
  findPublicCommunitiesByFocus(focus: string): Promise<Community[]>;
  findCommunitiesByUserId(userId: string): Promise<Community[]>;
  update(community: Community): Promise<void>;
  delete(id: string): Promise<void>;
}

