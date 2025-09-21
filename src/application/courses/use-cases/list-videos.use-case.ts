import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import type { VideoProgressRepository } from '../../../domain/repositories/video-progress.repository';
import { Video } from '../../../domain/entities/video';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface ListVideosInput {
  subCourseId: string;
  userId?: string;
}

export interface VideoWithProgress {
  id: string;
  subCourseId: string;
  videoId: string;
  title: string;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  duration: number | null;
  channelTitle: string | null;
  channelId: string | null;
  channelThumbnailUrl: string | null;
  publishedAt: Date | null;
  viewCount: number | null;
  tags: string[] | null;
  category: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  isCompleted?: boolean;
  completedAt?: Date | null;
}

export interface ListVideosOutput {
  videos: VideoWithProgress[];
  courseProgress?: {
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  };
}

@Injectable()
export class ListVideosUseCase {
  constructor(
    private readonly subCourseRepository: SubCourseRepository,
    private readonly videoRepository: VideoRepository,
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    const videos = await this.videoRepository.findBySubCourseId(input.subCourseId);
    
    // Buscar progresso do usuário se userId foi fornecido
    let userProgress: Map<string, { isCompleted: boolean; completedAt: Date | null }> = new Map();
    if (input.userId) {
      const progressList = await this.videoProgressRepository.findByUserAndSubCourse(
        input.userId,
        input.subCourseId,
      );
      userProgress = new Map(
        progressList.map(p => [p.videoId, { isCompleted: p.isCompleted, completedAt: p.completedAt }])
      );
    }
    
    // Enriquecer vídeos com informações do canal do YouTube e progresso
    const enrichedVideos = await Promise.all(
      videos.map(async (video) => {
        // Se o vídeo não tem channelId ou channelThumbnailUrl, buscar do YouTube
        if (!video.channelId || !video.channelThumbnailUrl) {
          try {
            const youtubeVideo = await this.youtubeService.getVideoById(video.videoId);
            if (youtubeVideo) {
              // Criar um novo vídeo com as informações enriquecidas
              const enrichedVideo = new Video(
                video.id,
                video.moduleId,
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

              // Adicionar informações de progresso
              const progress = userProgress.get(video.id);
              return {
                ...enrichedVideo,
                isCompleted: progress?.isCompleted || false,
                completedAt: progress?.completedAt || null,
              } as VideoWithProgress;
            }
          } catch (error) {
            console.warn(`Erro ao buscar informações do canal para vídeo ${video.videoId}:`, error);
          }
        }

        // Adicionar informações de progresso ao vídeo original
        const progress = userProgress.get(video.id);
        return {
          ...video,
          isCompleted: progress?.isCompleted || false,
          completedAt: progress?.completedAt || null,
        } as VideoWithProgress;
      })
    );

    // Calcular progresso do curso se userId foi fornecido
    let courseProgress;
    if (input.userId) {
      courseProgress = await this.videoProgressRepository.getCourseProgress(
        input.userId,
        input.subCourseId,
      );
    }

    return { 
      videos: enrichedVideos,
      courseProgress,
    };
  }
}
