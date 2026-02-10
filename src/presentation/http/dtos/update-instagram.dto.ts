import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class UpdateInstagramDto {
  @ApiProperty({
    description: 'URL do perfil do Instagram',
    example: 'https://www.instagram.com/usuario',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.instagram !== '' && o.instagram !== null)
  @IsUrl({}, { message: 'Instagram deve ser uma URL válida' })
  instagram?: string | null;
}
