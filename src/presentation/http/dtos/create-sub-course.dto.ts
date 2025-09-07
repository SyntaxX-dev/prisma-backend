import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubCourseDto {
  @ApiProperty({
    description: 'Nome do sub-curso',
    example: 'Língua Portuguesa',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descrição do sub-curso',
    example: 'Aulas de português para PRF',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Ordem do sub-curso',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  order?: number;
}
