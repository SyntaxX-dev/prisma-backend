import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VideoProgress } from '../../domain/entities/video-progress';
import { VIDEO_REPOSITORY, VIDEO_PROGRESS_REPOSITORY } from '../../domain/tokens';
import type { VideoRepository } from '../../domain/repositories/video.repository';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import { OffensiveService } from '../../domain/services/offensive.service';

export interface MockOffensivesInput {
  userId: string;
  videoId: string;
  daysAgo?: number; // Quantos dias atrás completar (0 = hoje, 1 = ontem, etc)
  specificDate?: Date; // Data específica (opcional, sobrescreve daysAgo)
}

export interface MockOffensivesOutput {
  completedDate: Date;
  offensiveResult: {
    offensive: {
      id: string;
      type: string;
      consecutiveDays: number;
      lastVideoCompletedAt: Date;
      totalOffensives: number;
    };
    message: string;
  };
  info: {
    simulatedDate: Date;
    currentDate: Date;
    daysDifference: number;
  };
}

@Injectable()
export class MockOffensivesUseCase {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: VideoRepository,
    @Inject(VIDEO_PROGRESS_REPOSITORY)
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly offensiveService: OffensiveService,
  ) {}

  async execute(input: MockOffensivesInput): Promise<MockOffensivesOutput> {
    const { userId, videoId, daysAgo = 0, specificDate } = input;

    // Determinar data de conclusão
    let completedDate: Date;
    if (specificDate) {
      completedDate = new Date(specificDate);
    } else {
      completedDate = new Date();
      completedDate.setDate(completedDate.getDate() - daysAgo);
      completedDate.setHours(12, 0, 0, 0); // Meio-dia para evitar problemas de timezone
    }

    console.log(`[MOCK] MockOffensivesUseCase - userId: ${userId}, videoId: ${videoId}`);
    console.log(`[MOCK] Completando vídeo em: ${completedDate.toISOString()}`);

    // Verificar se o vídeo existe
    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error(`Vídeo com ID "${videoId}" não encontrado`);
    }

    // Buscar ou criar progresso
    let progress = await this.videoProgressRepository.findByUserAndVideo(
      userId,
      video.id,
    );

    if (!progress) {
      progress = await this.videoProgressRepository.create(
        new VideoProgress(
          randomUUID(),
          userId,
          video.id,
          video.subCourseId,
          true,
          completedDate,
          null,
          completedDate,
          completedDate,
        ),
      );
    } else {
      const updatedProgress = new VideoProgress(
        progress.id,
        progress.userId,
        progress.videoId,
        progress.subCourseId,
        true,
        completedDate,
        progress.currentTimestamp,
        progress.createdAt,
        completedDate,
      );
      
      await this.videoProgressRepository.update(updatedProgress);
      progress = updatedProgress;
    }

    // Recalcular ofensivas baseado em TODOS os vídeos completados
    const offensiveResult = await this.offensiveService.recalculateOffensives(userId);

    const currentDate = new Date();
    const daysDifference = Math.floor(
      (currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`[MOCK] Vídeo completado com sucesso`);
    console.log(`[MOCK] Diferença: ${daysDifference} dias`);
    console.log(`[MOCK] Ofensiva: ${offensiveResult.offensive.consecutiveDays} dias consecutivos (${offensiveResult.offensive.type})`);

    return {
      completedDate,
      offensiveResult: {
        offensive: {
          id: offensiveResult.offensive.id,
          type: offensiveResult.offensive.type,
          consecutiveDays: offensiveResult.offensive.consecutiveDays,
          lastVideoCompletedAt: offensiveResult.offensive.lastVideoCompletedAt,
          totalOffensives: offensiveResult.offensive.totalOffensives,
        },
        message: offensiveResult.message,
      },
      info: {
        simulatedDate: completedDate,
        currentDate,
        daysDifference,
      },
    };
  }
}

