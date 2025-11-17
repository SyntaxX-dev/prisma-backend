import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GenerateMindMapDto {
  @ApiProperty({
    description: 'Título do vídeo',
    example: 'Introdução ao React - Hooks e Components',
  })
  @IsString()
  videoTitle: string;

  @ApiProperty({
    description: 'Descrição do vídeo',
    example: 'Neste vídeo você aprenderá sobre React Hooks, componentes funcionais e state management',
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
