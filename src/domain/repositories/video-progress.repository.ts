import { VideoProgress } from '../entities/video-progress';

export interface VideoProgressRepository {
  create(progress: VideoProgress): Promise<VideoProgress>;
  findByUserAndVideo(userId: string, videoId: string): Promise<VideoProgress | null>;
  findByUserAndSubCourse(userId: string, subCourseId: string): Promise<VideoProgress[]>;
  update(progress: VideoProgress): Promise<void>;
  delete(id: string): Promise<void>;
  getCourseProgress(userId: string, subCourseId: string): Promise<{
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  }>;
  findCompletionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<VideoProgress[]>;
}
