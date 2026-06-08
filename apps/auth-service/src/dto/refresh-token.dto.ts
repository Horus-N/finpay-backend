import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'UserId is required!' })
  userId: string;
  @IsString()
  @IsNotEmpty({ message: 'RefreshToken is required!' })
  refreshToken: string;
}
