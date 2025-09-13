import { IsOptional, IsEnum, IsNumber, IsString, Min, Max } from 'class-validator';
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
}
