import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { UserFocus } from '../../../domain/enums/user-focus';
import { ContestType } from '../../../domain/enums/contest-type';
import { CollegeCourse } from '../../../domain/enums/college-course';
import { EducationLevel } from '../../../domain/enums/education-level';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsEnum(EducationLevel)
  educationLevel?: EducationLevel;

  @IsOptional()
  @IsEnum(UserFocus)
  userFocus?: UserFocus;

  @IsOptional()
  @IsEnum(ContestType)
  contestType?: ContestType;

  @IsOptional()
  @IsEnum(CollegeCourse)
  collegeCourse?: CollegeCourse;

  // Novos campos do perfil
  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsOptional()
  @IsString()
  aboutYou?: string;

  @IsOptional()
  @IsString()
  habilities?: string;

  @IsOptional()
  @IsString()
  momentCareer?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
