import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import type { VideoProgressRepository } from '../../../domain/repositories/video-progress.repository';
import type { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface ListModuleVideosInput {
  moduleId: string;
  userId: string;
}

export interface ListModuleVideosOutput {
  videos: any[];
  moduleProgress: {
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  };
}

@Injectable()
export class ListModuleVideosUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(input: ListModuleVideosInput): Promise<ListModuleVideosOutput> {
    // Verificar se o módulo existe
    const module = await this.moduleRepository.findById(input.moduleId);
    if (!module) {
      throw new Error(`Módulo com ID "${input.moduleId}" não encontrado`);
    }

    // Buscar vídeos do módulo
    const videos = await this.videoRepository.findByModuleId(input.moduleId);

    // Buscar progresso dos vídeos para o usuário
    const videosWithProgress = await Promise.all(
      videos.map(async (video) => {
        const progress = await this.videoProgressRepository.findByUserAndVideo(
          input.userId,
          video.id,
        );

        // Buscar informações adicionais do YouTube se necessário
        let youtubeData: any = null;
        if (video.videoId) {
          try {
            youtubeData = await this.youtubeService.getVideoById(video.videoId);
          } catch (error) {
            // Se falhar, continua sem os dados do YouTube
            console.warn(`Erro ao buscar dados do YouTube para vídeo ${video.videoId}:`, error);
          }
        }

        return {
          ...video,
          progress: progress ? {
            isCompleted: progress.isCompleted,
            completedAt: progress.completedAt,
          } : {
            isCompleted: false,
            completedAt: null,
          },
          youtubeData,
        };
      }),
    );

    // Calcular progresso do módulo
    const totalVideos = videosWithProgress.length;
    const completedVideos = videosWithProgress.filter(v => v.progress.isCompleted).length;
    const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return {
      videos: videosWithProgress,
      moduleProgress: {
        totalVideos,
        completedVideos,
        progressPercentage,
      },
    };
  }
}
