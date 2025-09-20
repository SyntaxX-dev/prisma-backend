import { Injectable } from '@nestjs/common';
import type { VideoProgressRepository } from '../../../domain/repositories/video-progress.repository';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';

export interface GetCourseProgressInput {
  userId: string;
  subCourseId: string;
}

export interface GetCourseProgressOutput {
  subCourseId: string;
  subCourseName: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
  isCompleted: boolean;
}

@Injectable()
export class GetCourseProgressUseCase {
  constructor(
    private readonly videoProgressRepository: VideoProgressRepository,
    private readonly subCourseRepository: SubCourseRepository,
  ) {}

  async execute(input: GetCourseProgressInput): Promise<GetCourseProgressOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    // Obter progresso do curso
    const progress = await this.videoProgressRepository.getCourseProgress(
      input.userId,
      input.subCourseId,
    );

    return {
      subCourseId: input.subCourseId,
      subCourseName: subCourse.name,
      totalVideos: progress.totalVideos,
      completedVideos: progress.completedVideos,
      progressPercentage: progress.progressPercentage,
      isCompleted: progress.progressPercentage === 100,
    };
  }
}
