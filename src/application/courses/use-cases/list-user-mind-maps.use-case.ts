import { Injectable } from '@nestjs/common';
import type { MindMapRepository } from '../../../domain/repositories/mind-map.repository';

export interface ListUserMindMapsInput {
  userId: string;
}

export interface MindMapSummary {
  id: string;
  videoId: string;
  content: string;
  videoTitle: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUserMindMapsOutput {
  mindMaps: MindMapSummary[];
  total: number;
}

@Injectable()
export class ListUserMindMapsUseCase {
  constructor(private readonly mindMapRepository: MindMapRepository) {}

  async execute(input: ListUserMindMapsInput): Promise<ListUserMindMapsOutput> {
    const mindMaps = await this.mindMapRepository.findByUserId(input.userId);

    return {
      mindMaps: mindMaps.map((mindMap) => ({
        id: mindMap.id,
        videoId: mindMap.videoId,
        content: mindMap.content,
        videoTitle: mindMap.videoTitle,
        videoUrl: mindMap.videoUrl,
        createdAt: mindMap.createdAt,
        updatedAt: mindMap.updatedAt,
      })),
      total: mindMaps.length,
    };
  }
}
