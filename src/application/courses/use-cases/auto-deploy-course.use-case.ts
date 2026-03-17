import { Injectable } from '@nestjs/common';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import { BulkProcessPlaylistsUseCase, BulkProcessPlaylistsOutput } from './bulk-process-playlists.use-case';

export interface AutoDeployCourseInput {
  topic: string;
  maxSubCourses?: number;
  aiPrompt?: string;
  courseId?: string;
}

@Injectable()
export class AutoDeployCourseUseCase {
  constructor(
    private readonly youtubeService: YouTubeService,
    private readonly geminiService: GeminiService,
    private readonly bulkProcessPlaylistsUseCase: BulkProcessPlaylistsUseCase,
  ) {}

  async execute(input: AutoDeployCourseInput): Promise<BulkProcessPlaylistsOutput> {
    const limit = input.maxSubCourses || 5;
    console.log(`[AutoDeploy] Iniciando busca para o tópico: "${input.topic}" (limit: ${limit})`);

    // 1. Buscar playlists no YouTube relacionadas ao tópico
    // Buscamos um pouco mais do que o limite para dar opções à IA
    const searchResults = await this.youtubeService.searchPlaylists(input.topic, 20);
    
    if (searchResults.length === 0) {
      throw new Error(`Nenhuma playlist encontrada para o tópico "${input.topic}"`);
    }

    console.log(`[AutoDeploy] Encontradas ${searchResults.length} playlists. Selecionando as melhores com IA...`);

    // 2. Usar Gemini para filtrar e selecionar as melhores playlists
    const selectedPlaylistIds = await this.geminiService.selectBestPlaylistsForTopic(
      input.topic,
      searchResults,
      limit
    );

    console.log(`[AutoDeploy] IA selecionou ${selectedPlaylistIds.length} playlists: ${selectedPlaylistIds.join(', ')}`);

    // 3. Chamar o BulkProcessPlaylistsUseCase para fazer o trabalho pesado
    // O BulkProcess já cria o curso (se não existir), subcursos, módulos e vídeos.
    return await this.bulkProcessPlaylistsUseCase.execute({
      playlistIds: selectedPlaylistIds,
      courseId: input.courseId,
      aiPrompt: input.aiPrompt || `Organize o conteúdo para um curso completo de ${input.topic}.`,
    });
  }
}
