import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCourseSubscriptionDto {
  @ApiProperty({
    description: 'Indica se o curso é pago (para assinantes)',
    example: true,
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPaid: boolean;
}
