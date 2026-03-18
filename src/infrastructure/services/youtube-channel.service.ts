import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChannelInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

@Injectable()
export class YouTubeChannelService {
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly cache = new Map<string, ChannelInfo>();

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      console.warn(
        'YOUTUBE_API_KEY não configurada. YouTube Channel Service desabilitado.',
      );
    }
    this.apiKey = apiKey || null;
  }

  async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
    if (this.cache.has(channelId)) {
      return this.cache.get(channelId) || null;
    }

    if (!this.apiKey) {
      console.warn(
        'YOUTUBE_API_KEY não configurada. Não é possível buscar informações do canal.',
      );
      return null;
    }

    try {
      const url = `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        const info = {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl:
            channel.snippet.thumbnails.high?.url ||
            channel.snippet.thumbnails.medium?.url ||
            channel.snippet.thumbnails.default?.url,
          subscriberCount: channel.statistics.subscriberCount,
          viewCount: channel.statistics.viewCount,
          videoCount: channel.statistics.videoCount,
        };
        this.cache.set(channelId, info);
        return info;
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar informações do canal:', error);
      return null;
    }
  }

  async getChannelInfoByUsername(
    username: string,
  ): Promise<ChannelInfo | null> {
    if (!this.apiKey) {
      console.warn(
        'YOUTUBE_API_KEY não configurada. Não é possível buscar informações do canal.',
      );
      return null;
    }

    try {
      // Primeiro, buscar o canal pelo username
      const searchUrl = `${this.baseUrl}/channels?part=snippet&forUsername=${username}&key=${this.apiKey}`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].id;
        return await this.getChannelInfo(channelId);
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar canal por username:', error);
      return null;
    }
  }

  async getChannelIdByHandle(handle: string): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      // Garantir que o handle começa com @
      const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const url = `${this.baseUrl}/channels?part=id&forHandle=${formattedHandle}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return data.items[0].id;
      }

      return null;
    } catch (error) {
      console.error(`Erro ao buscar ID do canal pelo handle ${handle}:`, error);
      return null;
    }
  }
}
