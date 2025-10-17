import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateMomentCareerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  momentCareer!: string;
}
