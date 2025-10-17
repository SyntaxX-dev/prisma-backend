import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateProfileImageDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  profileImage!: string;
}
