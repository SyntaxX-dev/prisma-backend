import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, sql, gte, lt } from 'drizzle-orm';
import { VideoProgress } from '../../domain/entities/video-progress';
import { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import { videoProgress, videos } from '../database/schema';

@Injectable()
export class VideoProgressDrizzleRepository implements VideoProgressRepository {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  async create(progress: VideoProgress): Promise<VideoProgress> {
    const [created] = await this.db
      .insert(videoProgress)
      .values({
        id: progress.id,
        userId: progress.userId,
        videoId: progress.videoId,
        subCourseId: progress.subCourseId,
        isCompleted: progress.isCompleted.toString(),
        completedAt: progress.completedAt,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      })
      .returning();

    return new VideoProgress(
      created.id,
      created.userId,
      created.videoId,
      created.subCourseId,
      created.isCompleted === 'true',
      created.completedAt,
      created.createdAt,
      created.updatedAt,
    );
  }

  async findByUserAndVideo(userId: string, videoId: string): Promise<VideoProgress | null> {
    const [result] = await this.db
      .select()
      .from(videoProgress)
      .where(and(eq(videoProgress.userId, userId), eq(videoProgress.videoId, videoId)))
      .limit(1);

    if (!result) return null;

    return new VideoProgress(
      result.id,
      result.userId,
      result.videoId,
      result.subCourseId,
      result.isCompleted === 'true',
      result.completedAt,
      result.createdAt,
      result.updatedAt,
    );
  }

  async findByUserAndSubCourse(userId: string, subCourseId: string): Promise<VideoProgress[]> {
    const results = await this.db
      .select()
      .from(videoProgress)
      .where(and(eq(videoProgress.userId, userId), eq(videoProgress.subCourseId, subCourseId)));

    return results.map(
      (result) =>
        new VideoProgress(
          result.id,
          result.userId,
          result.videoId,
          result.subCourseId,
          result.isCompleted === 'true',
          result.completedAt,
          result.createdAt,
          result.updatedAt,
        ),
    );
  }

  async update(progress: VideoProgress): Promise<void> {
    await this.db
      .update(videoProgress)
      .set({
        isCompleted: progress.isCompleted.toString(),
        completedAt: progress.completedAt,
        updatedAt: progress.updatedAt,
      })
      .where(eq(videoProgress.id, progress.id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(videoProgress).where(eq(videoProgress.id, id));
  }

  async getCourseProgress(userId: string, subCourseId: string): Promise<{
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  }> {
    // Contar total de vídeos no sub-curso
    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.subCourseId, subCourseId));

    const totalVideos = totalResult.count;

    // Contar vídeos concluídos pelo usuário
    const [completedResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(videoProgress)
      .where(
        and(
          eq(videoProgress.userId, userId),
          eq(videoProgress.subCourseId, subCourseId),
          eq(videoProgress.isCompleted, 'true'),
        ),
      );

    const completedVideos = completedResult.count;
    const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return {
      totalVideos,
      completedVideos,
      progressPercentage,
    };
  }

  async findCompletionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<VideoProgress[]> {
    const results = await this.db
      .select()
      .from(videoProgress)
      .where(
        and(
          eq(videoProgress.userId, userId),
          eq(videoProgress.isCompleted, 'true'),
          gte(videoProgress.completedAt, startDate),
          lt(videoProgress.completedAt, endDate),
        ),
      );

    return results.map(
      (result) =>
        new VideoProgress(
          result.id,
          result.userId,
          result.videoId,
          result.subCourseId,
          result.isCompleted === 'true',
          result.completedAt,
          result.createdAt,
          result.updatedAt,
        ),
    );
  }
}
