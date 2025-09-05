import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { YouTubeService } from '../../../infrastructure/services/youtube.service';
import {
  YouTubeVideoDto,
  YouTubeSearchDto,
  YouTubePlaylistDto,
} from '../dtos/youtube-video.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';

@ApiTags('YouTube')
@Controller('youtube')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @Post('search')
  @ApiOperation({ summary: 'Buscar vídeos no YouTube' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos encontrados',
    type: [YouTubeVideoDto],
  })
  async searchVideos(
    @Body() searchDto: YouTubeSearchDto,
  ): Promise<YouTubeVideoDto[]> {
    try {
      return await this.youtubeService.searchVideos(searchDto);
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar vídeos no YouTube',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('video/:videoId')
  @ApiOperation({ summary: 'Obter detalhes de um vídeo específico' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do vídeo',
    type: YouTubeVideoDto,
  })
  async getVideoById(
    @Param('videoId') videoId: string,
  ): Promise<YouTubeVideoDto> {
    try {
      const video = await this.youtubeService.getVideoById(videoId);
      if (!video) {
        throw new HttpException('Vídeo não encontrado', HttpStatus.NOT_FOUND);
      }
      return video;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao obter vídeo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('playlist/:playlistId')
  @ApiOperation({ summary: 'Obter vídeos de uma playlist' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos da playlist',
    type: [YouTubeVideoDto],
  })
  async getPlaylistVideos(
    @Param('playlistId') playlistId: string,
    @Query('maxResults') maxResults?: number,
  ): Promise<YouTubeVideoDto[]> {
    try {
      return await this.youtubeService.getPlaylistVideos(
        playlistId,
        maxResults,
      );
    } catch (error) {
      throw new HttpException(
        'Erro ao obter vídeos da playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('playlist/:playlistId/info')
  @ApiOperation({ summary: 'Obter informações de uma playlist' })
  @ApiResponse({
    status: 200,
    description: 'Informações da playlist',
    type: YouTubePlaylistDto,
  })
  async getPlaylistInfo(
    @Param('playlistId') playlistId: string,
  ): Promise<YouTubePlaylistDto> {
    try {
      const playlist = await this.youtubeService.getPlaylistInfo(playlistId);
      if (!playlist) {
        throw new HttpException(
          'Playlist não encontrada',
          HttpStatus.NOT_FOUND,
        );
      }
      return playlist;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao obter informações da playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('extract-from-url')
  @ApiOperation({ summary: 'Extrair dados de vídeo a partir de URL' })
  @ApiResponse({
    status: 200,
    description: 'Dados do vídeo extraídos da URL',
    type: YouTubeVideoDto,
  })
  async extractFromUrl(
    @Body() body: { url: string },
  ): Promise<YouTubeVideoDto> {
    try {
      const videoId = this.youtubeService.extractVideoIdFromUrl(body.url);
      if (!videoId) {
        throw new HttpException(
          'URL inválida do YouTube',
          HttpStatus.BAD_REQUEST,
        );
      }

      const video = await this.youtubeService.getVideoById(videoId);
      if (!video) {
        throw new HttpException('Vídeo não encontrado', HttpStatus.NOT_FOUND);
      }

      return video;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao extrair dados da URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('extract-playlist-from-url')
  @ApiOperation({ summary: 'Extrair dados de playlist a partir de URL' })
  @ApiResponse({
    status: 200,
    description: 'Dados da playlist extraídos da URL',
    type: YouTubePlaylistDto,
  })
  async extractPlaylistFromUrl(
    @Body() body: { url: string },
  ): Promise<YouTubePlaylistDto> {
    try {
      const playlistId = this.youtubeService.extractPlaylistIdFromUrl(body.url);
      if (!playlistId) {
        throw new HttpException(
          'URL inválida da playlist do YouTube',
          HttpStatus.BAD_REQUEST,
        );
      }

      const playlist = await this.youtubeService.getPlaylistInfo(playlistId);
      if (!playlist) {
        throw new HttpException(
          'Playlist não encontrada',
          HttpStatus.NOT_FOUND,
        );
      }

      return playlist;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao extrair dados da playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('extract-playlist-videos-from-url')
  @ApiOperation({ summary: 'Extrair vídeos de playlist a partir de URL' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos da playlist extraídos da URL',
    type: [YouTubeVideoDto],
  })
  async extractPlaylistVideosFromUrl(
    @Body() body: { url: string; maxResults?: number },
  ): Promise<YouTubeVideoDto[]> {
    try {
      const playlistId = this.youtubeService.extractPlaylistIdFromUrl(body.url);
      if (!playlistId) {
        throw new HttpException(
          'URL inválida da playlist do YouTube',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.youtubeService.getPlaylistVideos(
        playlistId,
        body.maxResults,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Erro ao extrair vídeos da playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
