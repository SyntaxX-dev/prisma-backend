import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class BulkProcessPlaylistsDto {
  @ApiProperty({
    description: 'Array de IDs de playlists do YouTube para processar',
    example: ['PLxxxxxxxxx1', 'PLxxxxxxxxx2'],
    type: [String],
    minItems: 1,
    maxItems: 20,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Deve ter pelo menos uma playlist' })
  @ArrayMaxSize(20, { message: 'Máximo de 20 playlists por requisição' })
  @IsString({ each: true, message: 'Cada ID de playlist deve ser uma string' })
  playlistIds: string[];

  @ApiProperty({
    description:
      'Prompt personalizado para a IA organizar os cursos (opcional)',
    example: 'Organize os cursos por nível: Básico, Intermediário e Avançado',
    required: false,
  })
  @IsOptional()
  @IsString()
  aiPrompt?: string;
}
