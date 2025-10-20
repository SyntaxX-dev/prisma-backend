import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAboutYouDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutYou?: string;
}
