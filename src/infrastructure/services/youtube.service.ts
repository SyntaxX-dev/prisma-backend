import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import { YouTubeVideoDto, YouTubeSearchDto, YouTubePlaylistDto } from '../../presentation/http/dtos/youtube-video.dto';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private youtube: youtube_v3.Youtube;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY não encontrada nas variáveis de ambiente');
    }

    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * Busca vídeos por termo de pesquisa
   */
  async searchVideos(searchDto: YouTubeSearchDto): Promise<YouTubeVideoDto[]> {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: searchDto.query,
        maxResults: searchDto.maxResults || 10,
        order: searchDto.order || 'relevance',
        type: ['video'],
      });

      if (!response.data.items) {
        return [];
      }

      // Buscar detalhes adicionais dos vídeos
      const videoIds = response.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      const videoDetails = await this.getVideoDetails(videoIds);

      return videoDetails;
    } catch (error) {
      this.logger.error('Erro ao buscar vídeos:', error);
      throw new Error('Falha ao buscar vídeos do YouTube');
    }
  }

  /**
   * Obtém detalhes de vídeos específicos por ID
   */
  async getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDto[]> {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
      });

      if (!response.data.items) {
        return [];
      }

      return response.data.items.map(video => this.mapVideoToDto(video));
    } catch (error) {
      this.logger.error('Erro ao obter detalhes dos vídeos:', error);
      throw new Error('Falha ao obter detalhes dos vídeos');
    }
  }

  /**
   * Obtém um vídeo específico por ID
   */
  async getVideoById(videoId: string): Promise<YouTubeVideoDto | null> {
    try {
      const videos = await this.getVideoDetails([videoId]);
      return videos[0] || null;
    } catch (error) {
      this.logger.error(`Erro ao obter vídeo ${videoId}:`, error);
      throw new Error('Falha ao obter vídeo');
    }
  }

  /**
   * Obtém vídeos de uma playlist
   */
  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<YouTubeVideoDto[]> {
    try {
      const response = await this.youtube.playlistItems.list({
        part: ['snippet'],
        playlistId,
        maxResults,
      });

      if (!response.data.items) {
        return [];
      }

      const videoIds = response.data.items
        .map(item => item.snippet?.resourceId?.videoId)
        .filter(Boolean) as string[];

      return await this.getVideoDetails(videoIds);
    } catch (error) {
      this.logger.error(`Erro ao obter vídeos da playlist ${playlistId}:`, error);
      throw new Error('Falha ao obter vídeos da playlist');
    }
  }

  /**
   * Obtém informações de uma playlist
   */
  async getPlaylistInfo(playlistId: string): Promise<YouTubePlaylistDto | null> {
    try {
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }

      const playlist = response.data.items[0];
      
      return {
        playlistId: playlist.id!,
        title: playlist.snippet?.title || '',
        description: playlist.snippet?.description || undefined,
        thumbnailUrl: playlist.snippet?.thumbnails?.high?.url || '',
        itemCount: parseInt(String(playlist.contentDetails?.itemCount || '0')),
        channelTitle: playlist.snippet?.channelTitle || '',
      };
    } catch (error) {
      this.logger.error(`Erro ao obter informações da playlist ${playlistId}:`, error);
      throw new Error('Falha ao obter informações da playlist');
    }
  }

  /**
   * Converte duração ISO 8601 para segundos
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Mapeia dados do YouTube para DTO
   */
  private mapVideoToDto(video: youtube_v3.Schema$Video): YouTubeVideoDto {
    const snippet = video.snippet!;
    const statistics = video.statistics!;
    const contentDetails = video.contentDetails!;

    return {
      videoId: video.id!,
      title: snippet.title || '',
      description: snippet.description || undefined,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      duration: this.parseDuration(contentDetails.duration || 'PT0S'),
      channelTitle: snippet.channelTitle || '',
      publishedAt: snippet.publishedAt || '',
      viewCount: parseInt(statistics.viewCount || '0'),
      tags: snippet.tags || undefined,
      category: snippet.categoryId || undefined,
    };
  }

  /**
   * Extrai ID do vídeo de uma URL do YouTube
   */
  extractVideoIdFromUrl(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extrai ID da playlist de uma URL do YouTube
   */
  extractPlaylistIdFromUrl(url: string): string | null {
    const pattern = /[?&]list=([^&\n?#]+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  }
}
