import { IsString, IsOptional, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Nome do curso',
    example: 'PRF',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição do curso',
    example: 'Polícia Rodoviária Federal',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL da imagem do curso',
    example: 'https://exemplo.com/prf-logo.png',
    required: false,
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
