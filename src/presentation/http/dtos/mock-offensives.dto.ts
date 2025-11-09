import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MockOffensivesDto {
  @ApiProperty({
    description: 'ID do vídeo a ser completado',
    example: 'uuid-do-video',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({
    description: 'Quantos dias atrás completar o vídeo (0 = hoje, 1 = ontem, 2 = anteontem, etc)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  daysAgo?: number;

  @ApiProperty({
    description: 'Data específica para completar o vídeo (formato ISO 8601). Se fornecido, sobrescreve daysAgo',
    example: '2025-11-05T12:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  specificDate?: string;
}

