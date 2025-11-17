import { Injectable } from '@nestjs/common';
import { GeminiService } from '../../../infrastructure/services/gemini.service';

export interface GenerateMindMapInput {
  videoTitle: string;
  videoDescription: string;
  videoUrl: string;
}

export interface GenerateMindMapOutput {
  mindMap: string;
}

@Injectable()
export class GenerateMindMapUseCase {
  constructor(private readonly geminiService: GeminiService) {}

  async execute(input: GenerateMindMapInput): Promise<GenerateMindMapOutput> {
    const mindMap = await this.geminiService.generateMindMap(
      input.videoTitle,
      input.videoDescription,
      input.videoUrl
    );

    return { mindMap };
  }
}
