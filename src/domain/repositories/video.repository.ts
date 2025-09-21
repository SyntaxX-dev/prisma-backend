import { Video } from '../entities/video';

export interface VideoRepository {
  create(video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<Video>;
  findById(id: string): Promise<Video | null>;
  findByVideoId(videoId: string): Promise<Video | null>;
  findByModuleId(moduleId: string): Promise<Video[]>;
  findBySubCourseId(subCourseId: string): Promise<Video[]>;
  findAll(): Promise<Video[]>;
  update(
    id: string,
    video: Partial<Omit<Video, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Video>;
  delete(id: string): Promise<void>;
  createMany(
    videos: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Video[]>;
}
