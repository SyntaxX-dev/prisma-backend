import { IsString, IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class UpdateLinksDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.linkedin !== '' && o.linkedin !== null && o.linkedin !== undefined)
  @IsUrl({}, { message: 'LinkedIn deve ser uma URL válida' })
  linkedin?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.github !== '' && o.github !== null && o.github !== undefined)
  @IsUrl({}, { message: 'GitHub deve ser uma URL válida' })
  github?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.portfolio !== '' && o.portfolio !== null && o.portfolio !== undefined)
  @IsUrl({}, { message: 'Portfolio deve ser uma URL válida' })
  portfolio?: string;
}
