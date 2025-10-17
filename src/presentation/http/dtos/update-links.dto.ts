import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateLinksDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  linkedin?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  github?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  portfolio?: string;
}
