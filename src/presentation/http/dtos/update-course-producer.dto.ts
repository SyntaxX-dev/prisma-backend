import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseProducerDto {
  @ApiProperty({
    description: 'Define se o curso deve ser marcado como curso de produtor',
    example: true,
  })
  @IsBoolean()
  isProducerCourse: boolean;
}

