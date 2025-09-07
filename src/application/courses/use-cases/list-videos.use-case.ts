import { Injectable } from '@nestjs/common';
import type { SubCourseRepository } from '../../../domain/repositories/sub-course.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { Video } from '../../../domain/entities/video';

export interface ListVideosInput {
  subCourseId: string;
}

export interface ListVideosOutput {
  videos: Video[];
}

@Injectable()
export class ListVideosUseCase {
  constructor(
    private readonly subCourseRepository: SubCourseRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    // Verificar se o sub-curso existe
    const subCourse = await this.subCourseRepository.findById(input.subCourseId);
    if (!subCourse) {
      throw new Error(`Sub-curso com ID "${input.subCourseId}" não encontrado`);
    }

    const videos = await this.videoRepository.findBySubCourseId(input.subCourseId);
    return { videos };
  }
}
