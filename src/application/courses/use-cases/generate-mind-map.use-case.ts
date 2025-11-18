import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import { MindMapRepository } from '../../../domain/repositories/mind-map.repository';
import { MindMap } from '../../../domain/entities/mind-map';

export interface GenerateMindMapInput {
  userId: string;
  videoId: string;
  videoTitle: string;
  videoDescription: string;
  videoUrl: string;
}

export interface GenerateMindMapOutput {
  id: string;
  content: string;
  videoTitle: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GenerateMindMapUseCase {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly mindMapRepository: MindMapRepository,
  ) {}

  async execute(input: GenerateMindMapInput): Promise<GenerateMindMapOutput> {
    // Verificar se já existe um mapa mental para este vídeo e usuário
    const existing = await this.mindMapRepository.findByVideoIdAndUserId(
      input.videoId,
      input.userId,
    );

    // Se já existe, atualizar o conteúdo (regenerar)
    if (existing) {
      const mindMapContent = await this.geminiService.generateMindMap(
        input.videoTitle,
        input.videoDescription,
        input.videoUrl,
      );

      const updated = await this.mindMapRepository.update(existing.id, {
        content: mindMapContent,
        videoTitle: input.videoTitle,
        videoUrl: input.videoUrl,
      });

      return {
        id: updated.id,
        content: updated.content,
        videoTitle: updated.videoTitle,
        videoUrl: updated.videoUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    }

    // Caso contrário, gerar e criar novo
    const mindMapContent = await this.geminiService.generateMindMap(
      input.videoTitle,
      input.videoDescription,
      input.videoUrl,
    );

    const mindMapData = MindMap.create(
      input.userId,
      input.videoId,
      mindMapContent,
      input.videoTitle,
      input.videoUrl,
    );

    const created = await this.mindMapRepository.create(mindMapData);

    return {
      id: created.id,
      content: created.content,
      videoTitle: created.videoTitle,
      videoUrl: created.videoUrl,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }
}
