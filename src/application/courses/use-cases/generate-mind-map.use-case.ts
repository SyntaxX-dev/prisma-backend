import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import type { MindMapRepository } from '../../../domain/repositories/mind-map.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
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
  remainingGenerations?: number;
}

export class MindMapLimitExceededError extends Error {
  constructor(
    public readonly dailyLimit: number,
    public readonly generationsToday: number,
  ) {
    super(
      `Limite diário de gerações de mapa mental atingido. Você já gerou ${generationsToday}/${dailyLimit} mapas hoje.`,
    );
    this.name = 'MindMapLimitExceededError';
  }
}

@Injectable()
export class GenerateMindMapUseCase {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly mindMapRepository: MindMapRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GenerateMindMapInput): Promise<GenerateMindMapOutput> {
    // Verificar limite diário de gerações
    const limitInfo = await this.userRepository.getMindMapLimitInfo(
      input.userId,
    );

    if (!limitInfo.canGenerate) {
      throw new MindMapLimitExceededError(
        limitInfo.dailyLimit,
        limitInfo.generationsToday,
      );
    }

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

      // Incrementar contador de gerações
      await this.userRepository.incrementMindMapGeneration(input.userId);

      // Obter gerações restantes
      const updatedLimitInfo = await this.userRepository.getMindMapLimitInfo(
        input.userId,
      );

      return {
        id: updated.id,
        content: updated.content,
        videoTitle: updated.videoTitle,
        videoUrl: updated.videoUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        remainingGenerations: updatedLimitInfo.remainingGenerations,
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

    // Incrementar contador de gerações
    await this.userRepository.incrementMindMapGeneration(input.userId);

    // Obter gerações restantes
    const updatedLimitInfo = await this.userRepository.getMindMapLimitInfo(
      input.userId,
    );

    return {
      id: created.id,
      content: created.content,
      videoTitle: created.videoTitle,
      videoUrl: created.videoUrl,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      remainingGenerations: updatedLimitInfo.remainingGenerations,
    };
  }
}
