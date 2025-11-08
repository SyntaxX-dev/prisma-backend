import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Nome da comunidade',
    example: 'Comunidade PRF 2024',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Foco da comunidade',
    example: 'PRF',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  focus: string;

  @ApiProperty({
    description: 'Descrição da comunidade',
    example: 'Comunidade para estudos de PRF',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL da imagem da comunidade (opcional se enviar arquivo)',
    example: 'https://exemplo.com/community-image.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({
    description: 'Arquivo de imagem da comunidade (opcional, aceita JPG, PNG, GIF, WebP, máx 5MB)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  imageFile?: Express.Multer.File;

  @ApiProperty({
    description: 'Visibilidade da comunidade',
    enum: CommunityVisibility,
    example: CommunityVisibility.PUBLIC,
    required: true,
  })
  @IsEnum(CommunityVisibility)
  @IsNotEmpty()
  visibility: CommunityVisibility;
}

