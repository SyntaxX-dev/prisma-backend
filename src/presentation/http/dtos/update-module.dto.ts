import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModuleDto {
  @ApiProperty({
    description: 'Nome do módulo',
    example: 'Módulo 1: Introdução Atualizada',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descrição do módulo',
    example: 'Este módulo apresenta os conceitos básicos atualizados',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Ordem do módulo dentro do sub-curso',
    example: 2,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;
}
