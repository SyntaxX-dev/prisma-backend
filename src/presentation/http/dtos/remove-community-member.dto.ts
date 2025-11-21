import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveCommunityMemberDto {
  @ApiProperty({
    description: 'ID da comunidade',
    example: 'uuid-da-comunidade',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiProperty({
    description: 'ID do membro a ser removido',
    example: 'uuid-do-membro',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  memberId: string;
}

