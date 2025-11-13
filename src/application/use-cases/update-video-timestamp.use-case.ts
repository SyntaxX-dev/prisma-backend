import { Injectable } from '@nestjs/common';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import type { VideoRepository } from '../../domain/repositories/video.repository';
import { VideoProgress } from '../../domain/entities/video-progress';
import { v4 as randomUUID } from 'uuid';

export interface UpdateVideoTimestampInput {
  userId: string;
  videoId: string;
  timestamp: number; // Posição em segundos
}

export interface UpdateVideoTimestampOutput {
  progress: VideoProgress;
}

@Injectable()
export class UpdateVideoTimestampUseCase {
  constructor(
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: UpdateVideoTimestampInput): Promise<UpdateVideoTimestampOutput> {
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
      // Criar novo progresso com timestamp
      const newProgress = VideoProgress.create(
        input.userId,
        video.id,
        video.subCourseId,
        false, // Não completado
        input.timestamp,
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
      // Se o vídeo estava completado, desmarcar ao atualizar timestamp
      // (usuário está assistindo novamente)
      let updatedProgress = progress.updateTimestamp(input.timestamp);
      if (progress.isCompleted) {
        console.log('[UpdateTimestamp] Vídeo estava completado, desmarcando...');
        updatedProgress = updatedProgress.markAsIncomplete();
      }

      await this.videoProgressRepository.update(updatedProgress);
      progress = updatedProgress;
    }

    return { progress };
  }
}

