import { IsArray, IsString, IsNotEmpty, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class UpdateHabilitiesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  habilities!: string[];
}
