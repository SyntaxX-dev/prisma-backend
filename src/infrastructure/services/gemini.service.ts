import { Injectable } from '@nestjs/common';

export interface VideoData {
  videoId: string;
  title: string;
  description?: string;
  duration?: number;
  tags?: string[];
}

export interface ModuleSuggestion {
  name: string;
  description: string;
  videoIndices: number[];
}

@Injectable()
export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY não configurada. Usando algoritmo local como fallback.');
    }
  }

  async organizeVideosIntoModules(
    videos: VideoData[],
    customPrompt?: string
  ): Promise<ModuleSuggestion[]> {
    if (!this.apiKey) {
      // Fallback para algoritmo local se não tiver API key
      return this.fallbackAlgorithm(videos);
    }

    try {
      const prompt = this.buildPrompt(videos, customPrompt);
      const response = await this.callGeminiAPI(prompt);
      return this.parseGeminiResponse(response);
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      // Fallback para algoritmo local em caso de erro
      return this.fallbackAlgorithm(videos);
    }
  }

  private buildPrompt(videos: VideoData[], customPrompt?: string): string {
    const defaultPrompt = `
Você é um especialista em organização de conteúdo educacional. Analise a lista de vídeos abaixo e organize-os em módulos lógicos e sequenciais.

INSTRUÇÕES:
- Agrupe vídeos relacionados em módulos 
- Mantenha a ordem sequencial dos vídeos
- Crie nomes de módulos descritivos e profissionais relacionados ao conteúdo dos vídeos, não pode ser muito grande.
- Foque em agrupar por tópicos/conceitos similares
- Evite criar muitos módulos pequenos ou módulos com muitos vídeos

${customPrompt ? `PROMPT PERSONALIZADO: ${customPrompt}` : ''}

VÍDEOS PARA ORGANIZAR:
${videos.map((video, index) => 
  `${index}: "${video.title}" (${video.duration ? Math.round(video.duration/60) + 'min' : 'duração desconhecida'})`
).join('\n')}

Responda APENAS com um JSON no seguinte formato:
{
  "modules": [
    {
      "name": "Nome do Módulo",
      "description": "Descrição do que será ensinado neste módulo",
      "videoIndices": [0, 1, 2, 3]
    }
  ]
}
`;

    return defaultPrompt;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private parseGeminiResponse(response: string): ModuleSuggestion[] {
    try {
      // Extrair JSON da resposta (pode ter texto antes/depois)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.modules || [];
    } catch (error) {
      console.error('Erro ao parsear resposta do Gemini:', error);
      throw error;
    }
  }

  private fallbackAlgorithm(videos: VideoData[]): ModuleSuggestion[] {
    // Algoritmo local como fallback
    const modules: ModuleSuggestion[] = [];
    const videosPerModule = 6; // 6 vídeos por módulo

    for (let i = 0; i < videos.length; i += videosPerModule) {
      const moduleVideos = videos.slice(i, i + videosPerModule);
      const moduleNumber = Math.floor(i / videosPerModule) + 1;
      
      modules.push({
        name: `Módulo ${moduleNumber}`,
        description: `Conteúdo do módulo ${moduleNumber} com ${moduleVideos.length} vídeos`,
        videoIndices: moduleVideos.map((_, index) => i + index)
      });
    }

    return modules;
  }
}
