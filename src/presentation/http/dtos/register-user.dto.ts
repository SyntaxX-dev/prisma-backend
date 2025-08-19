/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { EducationLevel } from '../../../domain/enums/education-level';
import { Transform } from 'class-transformer';

const educationLevelPtToEn: Record<string, EducationLevel> = {
  FUNDAMENTAL: EducationLevel.ELEMENTARY,
  ENSINO_MEDIO: EducationLevel.HIGH_SCHOOL,
  GRADUACAO: EducationLevel.UNDERGRADUATE,
  POS_GRADUACAO: EducationLevel.POSTGRADUATE,
  MESTRADO: EducationLevel.MASTER,
  DOUTORADO: EducationLevel.DOCTORATE,
};

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(6)
  confirmPassword!: string;

  @IsInt()
  @Min(0)
  age!: number;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return educationLevelPtToEn[value];
  })
  educationLevel!: EducationLevel;
}
