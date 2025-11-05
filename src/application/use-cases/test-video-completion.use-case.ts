import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { VideoProgress } from '../../domain/entities/video-progress';
import type { VideoRepository } from '../../domain/repositories/video.repository';
import type { VideoProgressRepository } from '../../domain/repositories/video-progress.repository';
import { OffensiveService } from '../../domain/services/offensive.service';

export interface TestVideoCompletionInput {
  userId: string;
  videoId: string;
  completedAt: Date;
}

export interface TestVideoCompletionOutput {
  progress: VideoProgress;
  offensiveResult?: {
    offensive: any;
    isNewOffensive: boolean;
    isStreakBroken: boolean;
    message: string;
  };
  testInfo: {
    simulatedDate: Date;
    currentDate: Date;
    daysDifference: number;
  };
}

@Injectable()
export class TestVideoCompletionUseCase {
  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly offensiveService: OffensiveService,
  ) {}

  async execute(input: TestVideoCompletionInput): Promise<TestVideoCompletionOutput> {
    const { userId, videoId, completedAt } = input;

    console.log(`[TEST] TestVideoCompletionUseCase - userId: ${userId}, videoId: ${videoId}, completedAt: ${completedAt.toISOString()}`);

    const video = await this.videoRepository.findById(videoId);
    if (!video) {
      throw new Error(`Vídeo com ID "${videoId}" não encontrado`);
    }

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
          completedAt,
          null,
          completedAt,
          completedAt,
        ),
      );
    } else {
      const updatedProgress = new VideoProgress(
        progress.id,
        progress.userId,
        progress.videoId,
        progress.subCourseId,
        true,
        completedAt,
        progress.currentTimestamp,
        progress.createdAt,
        completedAt,
      );
      
      await this.videoProgressRepository.update(updatedProgress);
      progress = updatedProgress;
    }

    const offensiveResult = await this.offensiveService.processVideoCompletion(
      userId,
      completedAt,
    );

    const currentDate = new Date();
    const daysDifference = Math.floor(
      (currentDate.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`[TEST] Video completado com sucesso em ${completedAt.toISOString()}`);
    console.log(`[TEST] Diferença de dias: ${daysDifference} dias atrás`);
    console.log(`[TEST] Ofensiva atual: ${offensiveResult.offensive.consecutiveDays} dias consecutivos`);

    return {
      progress,
      offensiveResult,
      testInfo: {
        simulatedDate: completedAt,
        currentDate,
        daysDifference,
      },
    };
  }
}

