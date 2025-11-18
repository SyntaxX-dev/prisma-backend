import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteToCommunityDto {
  @ApiProperty({
    description: 'ID da comunidade',
    example: 'uuid-da-comunidade',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiProperty({
    description: 'Nome de usuário da pessoa a ser convidada',
    example: 'joao_silva',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  inviteeUsername: string;
}
