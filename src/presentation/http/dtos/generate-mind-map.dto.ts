import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GenerateMindMapDto {
  @ApiProperty({
    description: 'ID do vídeo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  videoId: string;

  @ApiProperty({
    description: 'Título do vídeo',
    example: 'Introdução à Primeira Guerra Mundial - História para o ENEM',
  })
  @IsString()
  videoTitle: string;

  @ApiProperty({
    description: 'Descrição do vídeo',
    example:
      'Neste vídeo você aprenderá sobre as causas e consequências da Primeira Guerra Mundial',
  })
  @IsString()
  videoDescription: string;

  @ApiProperty({
    description: 'URL do vídeo no YouTube',
    example: 'https://youtube.com/watch?v=abc123',
  })
  @IsString()
  videoUrl: string;
}

export class GetMindMapByVideoDto {
  @ApiProperty({
    description: 'ID do vídeo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  videoId: string;
}
