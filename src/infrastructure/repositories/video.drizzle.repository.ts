import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { VideoRepository } from '../../domain/repositories/video.repository';
import { Video } from '../../domain/entities/video';
import { DrizzleService } from '../config/providers/drizzle.service';
import { videos } from '../database/schema';

@Injectable()
export class VideoDrizzleRepository implements VideoRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(
    video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Video> {
    const [created] = await this.drizzleService.db
      .insert(videos)
      .values({
        subCourseId: video.subCourseId,
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        channelTitle: video.channelTitle,
        channelId: video.channelId,
        channelThumbnailUrl: video.channelThumbnailUrl,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        tags: video.tags,
        category: video.category,
        order: video.order,
      })
      .returning();

    return new Video(
      created.id,
      created.subCourseId,
      created.videoId,
      created.title,
      created.description,
      created.url,
      created.thumbnailUrl,
      created.duration,
      created.channelTitle,
      created.channelId,
      created.channelThumbnailUrl,
      created.publishedAt,
      created.viewCount,
      created.tags,
      created.category,
      created.order,
      created.createdAt,
      created.updatedAt,
    );
  }

  async findById(id: string): Promise<Video | null> {
    const [video] = await this.drizzleService.db
      .select()
      .from(videos)
      .where(eq(videos.id, id));

    if (!video) return null;

    return new Video(
      video.id,
      video.subCourseId,
      video.videoId,
      video.title,
      video.description,
      video.url,
      video.thumbnailUrl,
      video.duration,
      video.channelTitle,
      video.channelId,
      video.channelThumbnailUrl,
      video.publishedAt,
      video.viewCount,
      video.tags,
      video.category,
      video.order,
      video.createdAt,
      video.updatedAt,
    );
  }

  async findByVideoId(videoId: string): Promise<Video | null> {
    const [video] = await this.drizzleService.db
      .select()
      .from(videos)
      .where(eq(videos.videoId, videoId));

    if (!video) return null;

    return new Video(
      video.id,
      video.subCourseId,
      video.videoId,
      video.title,
      video.description,
      video.url,
      video.thumbnailUrl,
      video.duration,
      video.channelTitle,
      video.channelId,
      video.channelThumbnailUrl,
      video.publishedAt,
      video.viewCount,
      video.tags,
      video.category,
      video.order,
      video.createdAt,
      video.updatedAt,
    );
  }

  async findBySubCourseId(subCourseId: string): Promise<Video[]> {
    const videosList = await this.drizzleService.db
      .select()
      .from(videos)
      .where(eq(videos.subCourseId, subCourseId))
      .orderBy(videos.order, videos.createdAt);

    return videosList.map(
      (video) =>
        new Video(
          video.id,
          video.subCourseId,
          video.videoId,
          video.title,
          video.description,
          video.url,
          video.thumbnailUrl,
          video.duration,
          video.channelTitle,
          video.channelId,
          video.channelThumbnailUrl,
          video.publishedAt,
          video.viewCount,
          video.tags,
          video.category,
          video.order,
          video.createdAt,
          video.updatedAt,
        ),
    );
  }

  async findAll(): Promise<Video[]> {
    const videosList = await this.drizzleService.db
      .select()
      .from(videos)
      .orderBy(videos.order, videos.createdAt);

    return videosList.map(
      (video) =>
        new Video(
          video.id,
          video.subCourseId,
          video.videoId,
          video.title,
          video.description,
          video.url,
          video.thumbnailUrl,
          video.duration,
          video.channelTitle,
          video.channelId,
          video.channelThumbnailUrl,
          video.publishedAt,
          video.viewCount,
          video.tags,
          video.category,
          video.order,
          video.createdAt,
          video.updatedAt,
        ),
    );
  }

  async update(
    id: string,
    video: Partial<Omit<Video, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Video> {
    const [updated] = await this.drizzleService.db
      .update(videos)
      .set({
        subCourseId: video.subCourseId,
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        channelTitle: video.channelTitle,
        channelId: video.channelId,
        channelThumbnailUrl: video.channelThumbnailUrl,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        tags: video.tags,
        category: video.category,
        order: video.order,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id))
      .returning();

    return new Video(
      updated.id,
      updated.subCourseId,
      updated.videoId,
      updated.title,
      updated.description,
      updated.url,
      updated.thumbnailUrl,
      updated.duration,
      updated.channelTitle,
      updated.channelId,
      updated.channelThumbnailUrl,
      updated.publishedAt,
      updated.viewCount,
      updated.tags,
      updated.category,
      updated.order,
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db.delete(videos).where(eq(videos.id, id));
  }

  async createMany(
    videosList: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<Video[]> {
    const created = await this.drizzleService.db
      .insert(videos)
      .values(
        videosList.map((video) => ({
          subCourseId: video.subCourseId,
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          duration: video.duration,
          channelTitle: video.channelTitle,
          channelId: video.channelId,
          channelThumbnailUrl: video.channelThumbnailUrl,
          publishedAt: video.publishedAt,
          viewCount: video.viewCount,
          tags: video.tags,
          category: video.category,
          order: video.order,
        })),
      )
      .returning();

    return created.map(
      (video) =>
        new Video(
          video.id,
          video.subCourseId,
          video.videoId,
          video.title,
          video.description,
          video.url,
          video.thumbnailUrl,
          video.duration,
          video.channelTitle,
          video.channelId,
          video.channelThumbnailUrl,
          video.publishedAt,
          video.viewCount,
          video.tags,
          video.category,
          video.order,
          video.createdAt,
          video.updatedAt,
        ),
    );
  }
}
