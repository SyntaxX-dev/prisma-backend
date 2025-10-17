import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAboutDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutYou?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  habilities?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  momentCareer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
