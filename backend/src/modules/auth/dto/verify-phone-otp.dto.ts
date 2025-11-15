import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneOtpDto {
  @ApiProperty({
    description: 'Số điện thoại đã nhận OTP',
    example: '0901234567',
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại không hợp lệ (phải có 10-11 số)',
  })
  phone: string;

  @ApiProperty({
    description: 'Mã OTP 6 số',
    example: '123456',
  })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 số' })
  @Matches(/^[0-9]{6}$/, {
    message: 'Mã OTP chỉ được chứa số',
  })
  otpCode: string;
}
