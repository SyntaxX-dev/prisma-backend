import { ApiProperty } from '@nestjs/swagger';

export class InProgressVideoDto {
  @ApiProperty({
    description: 'ID do vídeo no YouTube',
    example: 'FXqX7oof0I4',
  })
  videoId: string;

  @ApiProperty({
    description: 'Título do vídeo',
    example: 'Curso React: Introdução - #01',
  })
  videoTitle: string;

  @ApiProperty({
    description: 'URL do vídeo',
    example: 'https://www.youtube.com/watch?v=FXqX7oof0I4',
  })
  videoUrl: string;

  @ApiProperty({
    description: 'URL da thumbnail do vídeo',
    example: 'https://i.ytimg.com/vi/FXqX7oof0I4/hqdefault.jpg',
    nullable: true,
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: 'ID do sub-curso',
    example: 'uuid-do-subcurso',
  })
  subCourseId: string;

  @ApiProperty({
    description: 'Posição atual do vídeo em segundos',
    example: 120,
  })
  currentTimestamp: number;

  @ApiProperty({
    description: 'Duração total do vídeo em segundos',
    example: 600,
    nullable: true,
  })
  duration: number | null;

  @ApiProperty({
    description: 'Percentual de progresso do vídeo (0-100)',
    example: 20,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Data e hora da última visualização',
    example: '2024-01-15T10:30:00Z',
  })
  lastWatchedAt: Date;
}
