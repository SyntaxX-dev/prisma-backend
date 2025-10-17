import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateAboutYouDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  aboutYou!: string;
}
