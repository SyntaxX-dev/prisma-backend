import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVideoDto {
  @ApiProperty({
    description: 'ID do vídeo no YouTube',
    example: 'DsAJ18o6sco',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({
    description: 'Título do vídeo',
    example: 'Concurso PRF 2024 - Aula de Língua Portuguesa | Alfacon',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'URL do vídeo no YouTube',
    example: 'https://www.youtube.com/watch?v=DsAJ18o6sco',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Descrição do vídeo',
    example: 'Aula completa de português para o concurso da PRF...',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL da thumbnail do vídeo',
    example: 'https://i.ytimg.com/vi/DsAJ18o6sco/hqdefault.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Duração do vídeo em segundos',
    example: 3998,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'Nome do canal do YouTube',
    example: 'AlfaCon',
    required: false,
  })
  @IsString()
  @IsOptional()
  channelTitle?: string;

  @ApiProperty({
    description: 'Data de publicação do vídeo',
    example: '2024-01-07T18:11:04Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({
    description: 'Número de visualizações',
    example: 15589,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  viewCount?: number;

  @ApiProperty({
    description: 'Tags do vídeo',
    example: ['alfacon', 'prf', 'português'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Categoria do vídeo',
    example: '27',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Ordem do vídeo',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class CreateVideosDto {
  @ApiProperty({
    description: 'Lista de vídeos para adicionar',
    type: [CreateVideoDto],
    required: true,
  })
  @IsArray()
  videos: CreateVideoDto[];
}
