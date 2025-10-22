import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateTwitterDto {
  @ApiProperty({
    description: 'URL do perfil do Twitter/X',
    example: 'https://twitter.com/usuario',
    required: false,
    nullable: true
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Twitter deve ser uma URL válida' })
  twitter?: string | null;
}
