import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class YouTubeVideoDto {
  @ApiProperty({ description: 'ID do vídeo no YouTube' })
  @IsString()
  videoId: string;

  @ApiProperty({ description: 'Título do vídeo' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição do vídeo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL do vídeo' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'URL da thumbnail' })
  @IsString()
  thumbnailUrl: string;

  @ApiProperty({ description: 'Duração do vídeo em segundos' })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Canal do YouTube' })
  @IsString()
  channelTitle: string;

  @ApiProperty({ description: 'ID do canal' })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty({ description: 'URL da thumbnail do canal' })
  @IsString()
  @IsOptional()
  channelThumbnailUrl?: string;

  @ApiProperty({ description: 'Data de publicação' })
  @IsString()
  publishedAt: string;

  @ApiProperty({ description: 'Número de visualizações' })
  @IsNumber()
  viewCount: number;

  @ApiProperty({ description: 'Tags do vídeo' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Categoria do vídeo' })
  @IsString()
  @IsOptional()
  category?: string;
}

export class YouTubeSearchDto {
  @ApiProperty({ description: 'Termo de busca' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Número máximo de resultados', default: 10 })
  @IsNumber()
  @IsOptional()
  maxResults?: number = 10;

  @ApiProperty({ description: 'Ordenação dos resultados', default: 'relevance' })
  @IsString()
  @IsOptional()
  order?: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title' = 'relevance';
}

export class YouTubePlaylistDto {
  @ApiProperty({ description: 'ID da playlist' })
  @IsString()
  playlistId: string;

  @ApiProperty({ description: 'Título da playlist' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição da playlist' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'URL da thumbnail da playlist' })
  @IsString()
  thumbnailUrl: string;

  @ApiProperty({ description: 'Número de vídeos na playlist' })
  @IsNumber()
  itemCount: number;

  @ApiProperty({ description: 'Canal da playlist' })
  @IsString()
  channelTitle: string;
}
