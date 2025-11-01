import { Injectable } from '@nestjs/common';
import { v4 as randomUUID } from 'uuid';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import type { VideoRepository } from '../../domain/repositories/video.repository';
import { VideoProgress } from '../../domain/entities/video-progress';
import { OffensiveService } from '../../domain/services/offensive.service';

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
  offensiveResult?: {
    offensive: any;
    isNewOffensive: boolean;
    isStreakBroken: boolean;
    message: string;
  };
}

@Injectable()
export class ToggleVideoProgressUseCase {
  constructor(
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly videoRepository: VideoRepository,
    private readonly offensiveService: OffensiveService,
  ) {}

  async execute(input: ToggleVideoProgressInput): Promise<ToggleVideoProgressOutput> {
    console.log(`[DEBUG] ToggleVideoProgressUseCase - userId: ${input.userId}, videoId: ${input.videoId}, isCompleted: ${input.isCompleted}`);
    
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
          newProgress.currentTimestamp,
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

    // Processar ofensiva se o vídeo foi marcado como concluído
    let offensiveResult;
    console.log(`[DEBUG] Processing offensive - input.isCompleted: ${input.isCompleted}, progress.isCompleted: ${progress.isCompleted}`);
    
    if (input.isCompleted && progress.isCompleted) {
      console.log(`[DEBUG] Calling offensiveService.processVideoCompletion`);
      offensiveResult = await this.offensiveService.processVideoCompletion(
        input.userId,
        progress.completedAt!,
      );
    } else {
      console.log(`[DEBUG] Not processing offensive - conditions not met`);
    }

    return {
      progress,
      courseProgress,
      offensiveResult,
    };
  }
}
