import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { Video } from '../../../domain/entities/video';

export interface CreateVideoInput {
  subCourseId: string;
  videoId: string;
  title: string;
  url: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  channelTitle?: string;
  publishedAt?: Date;
  viewCount?: number;
  tags?: string[];
  category?: string;
  order?: number;
}

export interface CreateVideosInput {
  subCourseId: string;
  videos: Omit<CreateVideoInput, 'subCourseId'>[];
}

export interface CreateVideosOutput {
  videos: Video[];
}

@Injectable()
export class CreateVideosUseCase {
  constructor(
    private readonly subCourseRepository: SubCourseRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: CreateVideosInput): Promise<CreateVideosOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    // Verificar se algum vídeo já existe (por videoId)
    const existingVideos = await Promise.all(
      input.videos.map((video) => this.videoRepository.findByVideoId(video.videoId)),
    );

    const existingVideoIds = existingVideos
      .filter((video) => video !== null)
      .map((video) => video!.videoId);

    if (existingVideoIds.length > 0) {
      throw new Error(
        `Vídeos com os seguintes IDs já existem: ${existingVideoIds.join(', ')}`,
      );
    }

    // Criar os vídeos
    const videosData = input.videos.map((video) =>
      Video.create(
        '', // moduleId - será preenchido pelo repositório
        input.subCourseId,
        video.videoId,
        video.title,
        video.url,
        video.description,
        video.thumbnailUrl,
        video.duration,
        video.channelTitle,
        undefined, // channelId
        undefined, // channelThumbnailUrl
        video.publishedAt,
        video.viewCount,
        video.tags,
        video.category,
        video.order,
      ),
    );

    const videos = await this.videoRepository.createMany(videosData);

    return { videos };
  }
}
