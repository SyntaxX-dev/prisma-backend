import { Injectable } from '@nestjs/common';
import { v4 as randomUUID } from 'uuid';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import type { VideoRepository } from '../../domain/repositories/video.repository';
import { VideoProgress } from '../../domain/entities/video-progress';

export interface ToggleVideoProgressInput {
  userId: string;
  videoId: string;
  isCompleted: boolean;
}

export interface ToggleVideoProgressOutput {
  progress: VideoProgress;
  courseProgress: {
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  };
}

@Injectable()
export class ToggleVideoProgressUseCase {
  constructor(
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: ToggleVideoProgressInput): Promise<ToggleVideoProgressOutput> {
    // Verificar se o vídeo existe
    const video = await this.videoRepository.findByVideoId(input.videoId);
    if (!video) {
      throw new Error(`Vídeo com ID "${input.videoId}" não encontrado`);
    }

    // Buscar progresso existente
    let progress = await this.videoProgressRepository.findByUserAndVideo(
      input.userId,
      video.id,
    );

    if (!progress) {
      // Criar novo progresso
      const newProgress = VideoProgress.create(
        input.userId,
        video.id,
        video.subCourseId,
        input.isCompleted,
      );
      progress = await this.videoProgressRepository.create(
        new VideoProgress(
          randomUUID(),
          newProgress.userId,
          newProgress.videoId,
          newProgress.subCourseId,
          newProgress.isCompleted,
          newProgress.completedAt,
          new Date(),
          new Date(),
        ),
      );
    } else {
      // Atualizar progresso existente
      const updatedProgress = input.isCompleted
        ? progress.markAsCompleted()
        : progress.markAsIncomplete();
      
      await this.videoProgressRepository.update(updatedProgress);
      progress = updatedProgress;
    }

    // Calcular progresso do curso
    const courseProgress = await this.videoProgressRepository.getCourseProgress(
      input.userId,
      video.subCourseId,
    );

    return {
      progress,
      courseProgress,
    };
  }
}
