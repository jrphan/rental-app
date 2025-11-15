import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneOtpDto {
  @ApiProperty({
    description: 'Số điện thoại cần xác minh',
    example: '0901234567',
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại không hợp lệ (phải có 10-11 số)',
  })
  phone: string;
}
