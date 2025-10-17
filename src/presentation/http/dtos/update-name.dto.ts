import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
