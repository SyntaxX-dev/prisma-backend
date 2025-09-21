import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VideoDataDto {
  @ApiProperty({
    description: 'ID do vídeo do YouTube',
    example: 'DsAJ18o6sco',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({
    description: 'Título do vídeo',
    example: 'Aula 1: Introdução ao Conteúdo',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Descrição do vídeo',
    example: 'Primeira aula do módulo',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL do vídeo',
    example: 'https://www.youtube.com/watch?v=DsAJ18o6sco',
    required: true,
  })
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'URL da thumbnail do vídeo',
    example: 'https://i.ytimg.com/vi/DsAJ18o6sco/hqdefault.jpg',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Duração do vídeo em segundos',
    example: 3600,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'Título do canal',
    example: 'Canal Educativo',
    required: false,
  })
  @IsString()
  @IsOptional()
  channelTitle?: string;

  @ApiProperty({
    description: 'ID do canal',
    example: 'UC123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty({
    description: 'URL da thumbnail do canal',
    example: 'https://yt3.ggpht.com/...',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  channelThumbnailUrl?: string;

  @ApiProperty({
    description: 'Data de publicação do vídeo',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({
    description: 'Número de visualizações',
    example: 15000,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  viewCount?: number;

  @ApiProperty({
    description: 'Tags do vídeo',
    example: ['educação', 'tutorial', 'aula'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Categoria do vídeo',
    example: 'Education',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Ordem do vídeo dentro do módulo',
    example: 1,
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}

export class AddVideoToModuleDto {
  @ApiProperty({
    description: 'Lista de vídeos para adicionar ao módulo',
    type: [VideoDataDto],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoDataDto)
  videos: VideoDataDto[];
}
