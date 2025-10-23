import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class YouTubeVideoDto {
  @ApiProperty({ description: 'ID do vídeo no YouTube' })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({ description: 'Título do vídeo' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descrição do vídeo' })
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL do vídeo' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'URL da thumbnail do vídeo' })
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Duração do vídeo em segundos' })
  duration?: number;

  @ApiProperty({ description: 'Nome do canal' })
  @IsString()
  channelTitle?: string;

  @ApiProperty({ description: 'ID do canal' })
  @IsString()
  channelId?: string;

  @ApiProperty({ description: 'URL da thumbnail do canal' })
  @IsString()
  channelThumbnailUrl?: string;

  @ApiProperty({ description: 'Data de publicação' })
  @IsString()
  publishedAt?: string;

  @ApiProperty({ description: 'Número de visualizações' })
  viewCount?: number;

  @ApiProperty({ description: 'Tags do vídeo', type: [String], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Categoria do vídeo' })
  @IsString()
  category?: string;
}

export class ProcessYouTubePlaylistDto {
  @ApiProperty({ description: 'ID do curso onde será criado o subcurso' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Nome do subcurso que será criado' })
  @IsString()
  @IsNotEmpty()
  subCourseName: string;

  @ApiProperty({ description: 'Descrição do subcurso' })
  @IsString()
  subCourseDescription?: string;

  @ApiProperty({ 
    description: 'Prompt personalizado para a IA organizar os vídeos em módulos',
    required: false,
    example: 'Organize os vídeos em módulos lógicos baseado no conteúdo. Agrupe vídeos relacionados em módulos de 5-10 vídeos cada. Crie módulos como: "Fundamentos", "Conceitos Avançados", "Projeto Prático", etc.'
  })
  @IsString()
  aiPrompt?: string;

  @ApiProperty({ description: 'Lista de vídeos da playlist do YouTube', type: [YouTubeVideoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YouTubeVideoDto)
  videos: YouTubeVideoDto[];
}
