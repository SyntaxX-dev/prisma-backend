import { Injectable } from '@nestjs/common';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import { YouTubePlaylistDto } from '../../../presentation/http/dtos/youtube-video.dto';
import { BulkProcessPlaylistsUseCase, BulkProcessPlaylistsOutput } from './bulk-process-playlists.use-case';

export interface AutoDeployCourseInput {
  topic: string;
  maxSubCourses?: number;
  aiPrompt?: string;
  courseId?: string;
  channelIds?: string[];
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

    let searchResults: YouTubePlaylistDto[] = [];

    // 1. Buscar playlists
    if (input.channelIds && input.channelIds.length > 0) {
      console.log(`[AutoDeploy] Resolvendo e restringindo busca a ${input.channelIds.length} handles/canais`);
      
      const resolvedChannelIds: string[] = [];
      for (const id of input.channelIds) {
        const resolvedId = await this.youtubeService.resolveChannelId(id);
        if (resolvedId) {
          resolvedChannelIds.push(resolvedId);
        } else {
          console.warn(`[AutoDeploy] Não foi possível resolver o canal: ${id}`);
        }
      }

      if (resolvedChannelIds.length === 0) {
        throw new Error(`Não foi possível resolver nenhum dos canais fornecidos.`);
      }

      console.log(`[AutoDeploy] Canais resolvidos: ${resolvedChannelIds.join(', ')}`);
      
      // Buscar playlists específicas dentro de cada canal resolvido
      for (const channelId of resolvedChannelIds) {
        try {
          const results = await this.youtubeService.searchPlaylists(input.topic, 10, channelId);
          searchResults = [...searchResults, ...results];
        } catch (error) {
          console.error(`[AutoDeploy] Erro ao buscar no canal ${channelId}:`, error);
        }
      }
    } else {
      // Busca global (legado)
      searchResults = await this.youtubeService.searchPlaylists(input.topic, 20);
    }
    
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
