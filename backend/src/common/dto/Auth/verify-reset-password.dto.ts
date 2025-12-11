import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class VerifyResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otpCode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
