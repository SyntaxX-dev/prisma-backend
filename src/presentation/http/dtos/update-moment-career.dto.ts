import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateMomentCareerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  momentCareer?: string;
}
