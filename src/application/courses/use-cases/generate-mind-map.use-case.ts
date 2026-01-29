import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import type { MindMapRepository } from '../../../domain/repositories/mind-map.repository';
import type {
  UserRepository,
  GenerationType,
} from '../../../domain/repositories/user.repository';
import { MindMap } from '../../../domain/entities/mind-map';

export interface GenerateMindMapInput {
  userId: string;
  videoId: string;
  videoTitle: string;
  videoDescription: string;
  videoUrl: string;
  generationType: GenerationType; // 'mindmap' ou 'text'
}

export interface GenerateMindMapOutput {
  id: string;
  content: string;
  videoTitle: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  generationType: GenerationType;
  remainingGenerations?: number;
}

export class GenerationLimitExceededError extends Error {
  constructor(
    public readonly dailyLimit: number,
    public readonly generationsToday: number,
    public readonly generationType: GenerationType,
  ) {
    const typeLabel = generationType === 'mindmap' ? 'mapa mental' : 'texto';
    super(
      `Limite diário de gerações de ${typeLabel} atingido. Você já gerou ${generationsToday}/${dailyLimit} hoje.`,
    );
    this.name = 'GenerationLimitExceededError';
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
    const generationType = input.generationType || 'mindmap';

    // Verificar limite diário de gerações para o tipo específico
    const limitInfo = await this.userRepository.getGenerationLimitInfo(
      input.userId,
      generationType,
    );

    if (!limitInfo.canGenerate) {
      throw new GenerationLimitExceededError(
        limitInfo.dailyLimit,
        limitInfo.generationsToday,
        generationType,
      );
    }

    // Gerar conteúdo baseado no tipo
    const content = await this.geminiService.generateMindMap(
      input.videoTitle,
      input.videoDescription,
      input.videoUrl,
      generationType, // Passar o tipo para gerar formato diferente
    );

    // Verificar se já existe um mapa mental para este vídeo e usuário
    const existing = await this.mindMapRepository.findByVideoIdAndUserId(
      input.videoId,
      input.userId,
    );

    // Se já existe, atualizar o conteúdo (regenerar)
    if (existing) {
      const updated = await this.mindMapRepository.update(existing.id, {
        content,
        videoTitle: input.videoTitle,
        videoUrl: input.videoUrl,
        generationType, // Atualizar o tipo de geração
      });

      // Incrementar contador de gerações do tipo específico
      await this.userRepository.incrementGeneration(input.userId, generationType);

      // Obter gerações restantes
      const updatedLimitInfo = await this.userRepository.getGenerationLimitInfo(
        input.userId,
        generationType,
      );

      return {
        id: updated.id,
        content: updated.content,
        videoTitle: updated.videoTitle,
        videoUrl: updated.videoUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        generationType,
        remainingGenerations: updatedLimitInfo.remainingGenerations,
      };
    }

    // Caso contrário, criar novo
    const mindMapData = MindMap.create(
      input.userId,
      input.videoId,
      content,
      input.videoTitle,
      input.videoUrl,
      generationType, // Salvar o tipo de geração
    );

    const created = await this.mindMapRepository.create(mindMapData);

    // Incrementar contador de gerações do tipo específico
    await this.userRepository.incrementGeneration(input.userId, generationType);

    // Obter gerações restantes
    const updatedLimitInfo = await this.userRepository.getGenerationLimitInfo(
      input.userId,
      generationType,
    );

    return {
      id: created.id,
      content: created.content,
      videoTitle: created.videoTitle,
      videoUrl: created.videoUrl,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      generationType,
      remainingGenerations: updatedLimitInfo.remainingGenerations,
    };
  }
}
