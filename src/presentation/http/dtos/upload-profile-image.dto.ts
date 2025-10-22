import { ApiProperty } from '@nestjs/swagger';

export class UploadProfileImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo de imagem do perfil (JPG, PNG, GIF, WebP)',
    example: 'profile-image.jpg'
  })
  image!: Express.Multer.File;
}
