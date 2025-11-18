import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinCommunityDto {
  @ApiProperty({
    description: 'ID da comunidade',
    example: 'uuid-da-comunidade',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;
}
