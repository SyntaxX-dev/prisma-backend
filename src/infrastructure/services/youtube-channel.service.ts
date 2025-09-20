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
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY não encontrada nas variáveis de ambiente');
    }
    this.apiKey = apiKey;
  }

  async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
    try {
      const url = `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnailUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
          subscriberCount: channel.statistics.subscriberCount,
          viewCount: channel.statistics.viewCount,
          videoCount: channel.statistics.videoCount,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar informações do canal:', error);
      return null;
    }
  }

  async getChannelInfoByUsername(username: string): Promise<ChannelInfo | null> {
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
}
