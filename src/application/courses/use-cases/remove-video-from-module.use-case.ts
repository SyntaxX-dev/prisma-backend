import { Injectable } from '@nestjs/common';
import type { ModuleRepository } from '../../../domain/repositories/module.repository';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { Module } from '../../../domain/entities/module';

export interface RemoveVideoFromModuleInput {
  moduleId: string;
  videoId: string;
}

export interface RemoveVideoFromModuleOutput {
  success: boolean;
  module: Module;
}

@Injectable()
export class RemoveVideoFromModuleUseCase {
  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly videoRepository: VideoRepository,
  ) {}

  async execute(input: RemoveVideoFromModuleInput): Promise<RemoveVideoFromModuleOutput> {
    // Verificar se o módulo existe
    const module = await this.moduleRepository.findById(input.moduleId);
    if (!module) {
      throw new Error(`Módulo com ID "${input.moduleId}" não encontrado`);
    }

    // Verificar se o vídeo existe e pertence ao módulo
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new Error(`Vídeo com ID "${input.videoId}" não encontrado`);
    }

    if (video.moduleId !== input.moduleId) {
      throw new Error(`Vídeo não pertence ao módulo especificado`);
    }

    // Remover o vídeo
    await this.videoRepository.delete(input.videoId);

    // Atualizar contagem de vídeos no módulo
    const videoCount = await this.moduleRepository.countVideosByModuleId(input.moduleId);
    const updatedModule = await this.moduleRepository.updateVideoCount(input.moduleId, videoCount);

    return { success: true, module: updatedModule };
  }
}
