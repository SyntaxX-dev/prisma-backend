import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;
}
