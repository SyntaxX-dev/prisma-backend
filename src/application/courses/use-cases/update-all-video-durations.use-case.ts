import { Injectable, Logger } from '@nestjs/common';
import type { VideoRepository } from '../../../domain/repositories/video.repository';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';

export interface UpdateAllVideoDurationsOutput {
  totalVideos: number;
  updatedVideos: number;
  failedVideos: number;
  skippedVideos: number;
}

@Injectable()
export class UpdateAllVideoDurationsUseCase {
  private readonly logger = new Logger(UpdateAllVideoDurationsUseCase.name);

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly youtubeService: YouTubeService,
  ) {}

  async execute(): Promise<UpdateAllVideoDurationsOutput> {
    // Buscar todos os vídeos sem duração
    const videosWithoutDuration = await this.videoRepository.findVideosWithoutDuration();

    this.logger.log(`Encontrados ${videosWithoutDuration.length} vídeos sem duração`);

    let updatedVideos = 0;
    let failedVideos = 0;
    let skippedVideos = 0;

    // Processar em lotes de 50 para não sobrecarregar a API do YouTube
    const batchSize = 50;
    for (let i = 0; i < videosWithoutDuration.length; i += batchSize) {
      const batch = videosWithoutDuration.slice(i, i + batchSize);
      const youtubeIds = batch.map((v) => v.videoId);

      try {
        // Buscar detalhes de todos os vídeos do lote de uma vez
        const youtubeVideos = await this.youtubeService.getVideoDetails(youtubeIds);

        // Criar um mapa para acesso rápido
        const youtubeVideoMap = new Map(
          youtubeVideos.map((v) => [v.videoId, v])
        );

        // Atualizar cada vídeo
        for (const video of batch) {
          const youtubeVideo = youtubeVideoMap.get(video.videoId);

          if (youtubeVideo && youtubeVideo.duration) {
            try {
              await this.videoRepository.update(video.id, {
                duration: youtubeVideo.duration,
                viewCount: youtubeVideo.viewCount,
              });
              updatedVideos++;
              this.logger.log(`Atualizado: ${video.title} - ${youtubeVideo.duration}s`);
            } catch (error) {
              failedVideos++;
              this.logger.error(`Falha ao atualizar ${video.title}:`, error);
            }
          } else {
            skippedVideos++;
            this.logger.warn(`Vídeo não encontrado no YouTube: ${video.videoId}`);
          }
        }

        // Aguardar um pouco entre lotes para não exceder limites da API
        if (i + batchSize < videosWithoutDuration.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        this.logger.error(`Erro ao processar lote:`, error);
        failedVideos += batch.length;
      }
    }

    this.logger.log(
      `Atualização concluída: ${updatedVideos} atualizados, ${failedVideos} falharam, ${skippedVideos} pulados`
    );

    return {
      totalVideos: videosWithoutDuration.length,
      updatedVideos,
      failedVideos,
      skippedVideos,
    };
  }
}
