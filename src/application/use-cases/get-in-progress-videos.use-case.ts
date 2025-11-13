import { Injectable } from '@nestjs/common';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import type { VideoRepository } from '../../domain/repositories/video.repository';

export interface InProgressVideo {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  subCourseId: string;
  currentTimestamp: number; // Em segundos
  duration: number | null; // Duração total do vídeo em segundos
  progressPercentage: number; // (currentTimestamp / duration) * 100
  lastWatchedAt: Date; // updatedAt do progresso
}

export interface GetInProgressVideosInput {
  userId: string;
}

export interface GetInProgressVideosOutput {
  videos: InProgressVideo[];
}

@Injectable()
export class GetInProgressVideosUseCase {
  constructor(
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: GetInProgressVideosInput): Promise<GetInProgressVideosOutput> {
    // Buscar todos os vídeos em progresso (não completos com timestamp)
    const progressList = await this.videoProgressRepository.findInProgressVideos(input.userId);

    console.log('[GetInProgressVideos] Progressos encontrados:', progressList.length);
    progressList.forEach(p => {
      console.log('[GetInProgressVideos] Progresso:', {
        videoId: p.videoId,
        currentTimestamp: p.currentTimestamp,
        isCompleted: p.isCompleted
      });
    });

    // Buscar informações completas dos vídeos
    const videosWithDetails = await Promise.all(
      progressList.map(async (progress) => {
        const video = await this.videoRepository.findById(progress.videoId);

        console.log('[GetInProgressVideos] Video buscado para ID:', progress.videoId, '-> encontrado:', !!video);

        if (!video) {
          console.warn('[GetInProgressVideos] Vídeo não encontrado no DB para ID:', progress.videoId);
          return null;
        }

        const progressPercentage = video.duration && video.duration > 0
          ? Math.round((progress.currentTimestamp! / video.duration) * 100)
          : 0;

        return {
          videoId: video.videoId,
          videoTitle: video.title,
          videoUrl: video.url,
          thumbnailUrl: video.thumbnailUrl,
          subCourseId: video.subCourseId,
          currentTimestamp: progress.currentTimestamp!,
          duration: video.duration,
          progressPercentage,
          lastWatchedAt: progress.updatedAt,
        } as InProgressVideo;
      })
    );

    // Filtrar nulls e ordenar por última visualização (mais recente primeiro)
    const videos = videosWithDetails
      .filter((v): v is InProgressVideo => v !== null)
      .sort((a, b) => b.lastWatchedAt.getTime() - a.lastWatchedAt.getTime());

    return { videos };
  }
}

