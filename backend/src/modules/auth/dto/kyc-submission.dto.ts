import { IsString, IsUrl, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class KycSubmissionDto {
  @ApiProperty({
    description: 'Số CMND/CCCD',
    example: '001234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  idNumber?: string;

  @ApiProperty({
    description: 'URL hình ảnh mặt trước CMND/CCCD',
    example: 'https://example.com/id-card-front.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  idCardFrontUrl?: string;

  @ApiProperty({
    description: 'URL hình ảnh mặt sau CMND/CCCD',
    example: 'https://example.com/id-card-back.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  idCardBackUrl?: string;

  @ApiProperty({
    description: 'URL hình ảnh passport',
    example: 'https://example.com/passport.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  passportUrl?: string;

  @ApiProperty({
    description: 'URL hình ảnh bằng lái xe',
    example: 'https://example.com/driver-license.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  driverLicenseUrl?: string;

  @ApiProperty({
    description: 'URL hình ảnh selfie với CMND/CCCD',
    example: 'https://example.com/selfie-with-id.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  selfieUrl?: string;

  @ApiProperty({
    description: 'Ghi chú bổ sung',
    example: 'Các tài liệu KYC của tôi',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
