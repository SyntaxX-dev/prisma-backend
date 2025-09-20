import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { Video } from '../../../domain/entities/video';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface ListVideosInput {
  subCourseId: string;
}

export interface ListVideosOutput {
  videos: Video[];
}

@Injectable()
export class ListVideosUseCase {
  constructor(
    private readonly subCourseRepository: SubCourseRepository,
    private readonly videoRepository: VideoRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    const videos = await this.videoRepository.findBySubCourseId(input.subCourseId);
    
    // Enriquecer vídeos com informações do canal do YouTube
    const enrichedVideos = await Promise.all(
      videos.map(async (video) => {
        // Se o vídeo não tem channelId ou channelThumbnailUrl, buscar do YouTube
        if (!video.channelId || !video.channelThumbnailUrl) {
          try {
            const youtubeVideo = await this.youtubeService.getVideoById(video.videoId);
            if (youtubeVideo) {
              // Criar um novo vídeo com as informações enriquecidas
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
                youtubeVideo.channelId || video.channelId,
                youtubeVideo.channelThumbnailUrl || video.channelThumbnailUrl,
                video.publishedAt,
                video.viewCount,
                video.tags,
                video.category,
                video.order,
                video.createdAt,
                video.updatedAt,
              );
            }
          } catch (error) {
            console.warn(`Erro ao buscar informações do canal para vídeo ${video.videoId}:`, error);
          }
        }
        return video;
      })
    );

    return { videos: enrichedVideos };
  }
}
