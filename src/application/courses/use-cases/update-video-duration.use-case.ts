import { Injectable, Logger } from '@nestjs/common';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface UpdateVideoDurationInput {
  videoId: string; // ID interno do vídeo no banco
}

export interface UpdateVideoDurationOutput {
  success: boolean;
  duration: number | null;
}

@Injectable()
export class UpdateVideoDurationUseCase {
  private readonly logger = new Logger(UpdateVideoDurationUseCase.name);

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(input: UpdateVideoDurationInput): Promise<UpdateVideoDurationOutput> {
    // Buscar o vídeo no banco
    const video = await this.videoRepository.findById(input.videoId);
    if (!video) {
      throw new Error(`Vídeo com ID "${input.videoId}" não encontrado`);
    }

    // Se já tem duração, retornar
    if (video.duration !== null && video.duration !== undefined) {
      return {
        success: true,
        duration: video.duration,
      };
    }

    // Buscar duração do YouTube
    try {
      const youtubeVideo = await this.youtubeService.getVideoById(video.videoId);
      if (!youtubeVideo) {
        this.logger.warn(`Vídeo ${video.videoId} não encontrado no YouTube`);
        return {
          success: false,
          duration: null,
        };
      }

      // Atualizar duração no banco
      await this.videoRepository.update(input.videoId, {
        duration: youtubeVideo.duration,
        viewCount: youtubeVideo.viewCount,
      });

      this.logger.log(`Duração atualizada para vídeo ${video.videoId}: ${youtubeVideo.duration}s`);

      return {
        success: true,
        duration: youtubeVideo.duration,
      };
    } catch (error) {
      this.logger.error(`Erro ao atualizar duração do vídeo ${video.videoId}:`, error);
      return {
        success: false,
        duration: null,
      };
    }
  }
}
