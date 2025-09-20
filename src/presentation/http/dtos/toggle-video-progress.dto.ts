import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleVideoProgressDto {
  @ApiProperty({
    description: 'ID do vídeo no YouTube',
    example: 'DsAJ18o6sco',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty({
    description: 'Se o vídeo foi marcado como concluído',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
