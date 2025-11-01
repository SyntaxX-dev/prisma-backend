import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class UpdateVideoTimestampDto {
  @ApiProperty({
    description: 'ID do vídeo no YouTube',
    example: 'FXqX7oof0I4',
  })
  @IsString()
  videoId: string;

  @ApiProperty({
    description: 'Posição atual do vídeo em segundos',
    example: 120,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Timestamp deve ser maior ou igual a 0' })
  timestamp: number;
}

