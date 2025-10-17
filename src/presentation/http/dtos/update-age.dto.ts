import { IsNumber, Min, Max } from 'class-validator';

export class UpdateAgeDto {
  @IsNumber()
  @Min(1)
  @Max(120)
  age!: number;
}
