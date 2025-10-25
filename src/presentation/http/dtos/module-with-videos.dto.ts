import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class VideoProgressDto {
  @ApiProperty({ description: 'Se o vídeo foi completado' })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({ description: 'Data de conclusão do vídeo', nullable: true })
  @IsString()
  @IsOptional()
  completedAt?: string | null;
}

export class VideoWithProgressDto {
  @ApiProperty({ description: 'ID do vídeo' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do módulo' })
  @IsString()
  moduleId: string;

  @ApiProperty({ description: 'ID do sub-curso' })
  @IsString()
  subCourseId: string;

  @ApiProperty({ description: 'ID do vídeo no YouTube' })
  @IsString()
  videoId: string;

  @ApiProperty({ description: 'Título do vídeo' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição do vídeo', nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({ description: 'URL do vídeo' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'URL da thumbnail', nullable: true })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string | null;

  @ApiProperty({ description: 'Duração em segundos', nullable: true })
  @IsNumber()
  @IsOptional()
  duration?: number | null;

  @ApiProperty({ description: 'Título do canal', nullable: true })
  @IsString()
  @IsOptional()
  channelTitle?: string | null;

  @ApiProperty({ description: 'ID do canal', nullable: true })
  @IsString()
  @IsOptional()
  channelId?: string | null;

  @ApiProperty({ description: 'URL da thumbnail do canal', nullable: true })
  @IsString()
  @IsOptional()
  channelThumbnailUrl?: string | null;

  @ApiProperty({ description: 'Data de publicação', nullable: true })
  @IsString()
  @IsOptional()
  publishedAt?: string | null;

  @ApiProperty({ description: 'Número de visualizações', nullable: true })
  @IsNumber()
  @IsOptional()
  viewCount?: number | null;

  @ApiProperty({ description: 'Tags do vídeo', type: [String], nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] | null;

  @ApiProperty({ description: 'Categoria do vídeo', nullable: true })
  @IsString()
  @IsOptional()
  category?: string | null;

  @ApiProperty({ description: 'Ordem do vídeo' })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Progresso do vídeo' })
  progress: VideoProgressDto;

  @ApiProperty({ description: 'Data de criação' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data de atualização' })
  @IsString()
  updatedAt: string;
}

export class ModuleProgressDto {
  @ApiProperty({ description: 'Total de vídeos no módulo' })
  @IsNumber()
  totalVideos: number;

  @ApiProperty({ description: 'Vídeos completados' })
  @IsNumber()
  completedVideos: number;

  @ApiProperty({ description: 'Percentual de progresso' })
  @IsNumber()
  progressPercentage: number;
}

export class ModuleWithVideosDto {
  @ApiProperty({ description: 'ID do módulo' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'ID do sub-curso' })
  @IsString()
  subCourseId: string;

  @ApiProperty({ description: 'Nome do módulo' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição do módulo', nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({ description: 'Ordem do módulo' })
  @IsNumber()
  order: number;

  @ApiProperty({ description: 'Número de vídeos no módulo' })
  @IsNumber()
  videoCount: number;

  @ApiProperty({ description: 'Vídeos do módulo', type: [VideoWithProgressDto] })
  @IsArray()
  videos: VideoWithProgressDto[];

  @ApiProperty({ description: 'Progresso do módulo' })
  moduleProgress: ModuleProgressDto;

  @ApiProperty({ description: 'Data de criação' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: 'Data de atualização' })
  @IsString()
  updatedAt: string;
}
