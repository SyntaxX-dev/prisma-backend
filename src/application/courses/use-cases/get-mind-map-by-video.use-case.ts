import { Injectable } from '@nestjs/common';
import type { MindMapRepository } from '../../../domain/repositories/mind-map.repository';

export interface GetMindMapByVideoInput {
  userId: string;
  videoId: string;
}

export interface GetMindMapByVideoOutput {
  id: string;
  content: string;
  videoTitle: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetMindMapByVideoUseCase {
  constructor(private readonly mindMapRepository: MindMapRepository) {}

  async execute(
    input: GetMindMapByVideoInput,
  ): Promise<GetMindMapByVideoOutput | null> {
    const mindMap = await this.mindMapRepository.findByVideoIdAndUserId(
      input.videoId,
      input.userId,
    );

    if (!mindMap) {
      return null;
    }

    return {
      id: mindMap.id,
      content: mindMap.content,
      videoTitle: mindMap.videoTitle,
      videoUrl: mindMap.videoUrl,
      createdAt: mindMap.createdAt,
      updatedAt: mindMap.updatedAt,
    };
  }
}
