import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class UpdateSocialLinksOrderDto {
  @ApiProperty({
    description: 'Array com a ordem dos links sociais',
    example: ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'],
    type: [String],
    minItems: 5,
    maxItems: 5,
  })
  @IsArray()
  @ArrayMinSize(5, { message: 'Deve conter exatamente 5 links' })
  @ArrayMaxSize(5, { message: 'Deve conter exatamente 5 links' })
  @IsString({ each: true, message: 'Cada item deve ser uma string' })
  socialLinksOrder!: string[];
}
