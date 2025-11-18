import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { Module } from '../../../domain/entities/module';

export interface VideoData {
  videoId: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  channelTitle?: string;
  channelId?: string;
  channelThumbnailUrl?: string;
  publishedAt?: Date;
  viewCount?: number;
  tags?: string[];
  category?: string;
  order?: number;
}

export interface AddVideosToModuleInput {
  moduleId: string;
  videos: VideoData[];
}

export interface AddVideosToModuleOutput {
  videos: any[];
  module: Module;
}

@Injectable()
export class AddVideosToModuleUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(
    input: AddVideosToModuleInput,
  ): Promise<AddVideosToModuleOutput> {
    // Verificar se o módulo existe
    const module = await this.moduleRepository.findById(input.moduleId);
    if (!module) {
      throw new Error(`Módulo com ID "${input.moduleId}" não encontrado`);
    }

    // Adicionar vídeos ao módulo
    const createdVideos: any[] = [];
    for (const videoData of input.videos) {
      const video = await this.videoRepository.create({
        moduleId: input.moduleId,
        subCourseId: module.subCourseId,
        videoId: videoData.videoId,
        title: videoData.title,
        description: videoData.description || null,
        url: videoData.url,
        thumbnailUrl: videoData.thumbnailUrl || null,
        duration: videoData.duration || null,
        channelTitle: videoData.channelTitle || null,
        channelId: videoData.channelId || null,
        channelThumbnailUrl: videoData.channelThumbnailUrl || null,
        publishedAt: videoData.publishedAt || null,
        viewCount: videoData.viewCount || null,
        tags: videoData.tags || null,
        category: videoData.category || null,
        order: videoData.order || 0,
      });
      createdVideos.push(video);
    }

    // Atualizar contagem de vídeos no módulo
    const videoCount = await this.moduleRepository.countVideosByModuleId(
      input.moduleId,
    );
    const updatedModule = await this.moduleRepository.updateVideoCount(
      input.moduleId,
      videoCount,
    );

    return { videos: createdVideos, module: updatedModule };
  }
}
