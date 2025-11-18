import { MindMap } from '../entities/mind-map';

export interface MindMapRepository {
  create(mindMap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>): Promise<MindMap>;
  findById(id: string): Promise<MindMap | null>;
  findByVideoIdAndUserId(videoId: string, userId: string): Promise<MindMap | null>;
  findByUserId(userId: string): Promise<MindMap[]>;
  update(
    id: string,
    mindMap: Partial<Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MindMap>;
  delete(id: string): Promise<void>;
}
