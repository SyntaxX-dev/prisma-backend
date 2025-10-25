import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import type { VideoProgressRepository } from '../../../domain/repositories/video-progress.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface ListModulesWithVideosInput {
  subCourseId: string;
  userId: string;
}

export interface ModuleWithVideos {
  id: string;
  subCourseId: string;
  name: string;
  description: string | null;
  order: number;
  videoCount: number;
  videos: Array<{
    id: string;
    moduleId: string;
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
    progress: {
      isCompleted: boolean;
      completedAt: Date | null;
    };
    youtubeData?: any;
    createdAt: Date;
    updatedAt: Date;
  }>;
  moduleProgress: {
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ListModulesWithVideosOutput {
  modules: ModuleWithVideos[];
}

@Injectable()
export class ListModulesWithVideosUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly subCourseRepository: SubCourseRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(input: ListModulesWithVideosInput): Promise<ListModulesWithVideosOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    // Buscar módulos do sub-curso
    const modules = await this.moduleRepository.findBySubCourseId(input.subCourseId);

    // Buscar todos os vídeos de todos os módulos em uma única query
    const allVideos = await this.videoRepository.findBySubCourseId(input.subCourseId);

    // Agrupar vídeos por módulo
    const videosByModule = new Map<string, typeof allVideos>();
    allVideos.forEach(video => {
      if (!videosByModule.has(video.moduleId)) {
        videosByModule.set(video.moduleId, []);
      }
      videosByModule.get(video.moduleId)!.push(video);
    });

    // Processar cada módulo com seus vídeos
    const modulesWithVideos = await Promise.all(
      modules.map(async (module) => {
        const moduleVideos = videosByModule.get(module.id) || [];
        
        // Buscar progresso de todos os vídeos do módulo
        const videosWithProgress = await Promise.all(
          moduleVideos.map(async (video) => {
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
          })
        );

        // Calcular progresso do módulo
        const totalVideos = videosWithProgress.length;
        const completedVideos = videosWithProgress.filter(v => v.progress.isCompleted).length;
        const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

        return {
          ...module,
          videos: videosWithProgress,
          moduleProgress: {
            totalVideos,
            completedVideos,
            progressPercentage,
          },
        };
      })
    );

    return { modules: modulesWithVideos };
  }
}
