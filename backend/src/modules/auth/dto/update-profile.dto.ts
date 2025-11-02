import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@/generated/prisma';

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Họ của user',
    example: 'Nguyễn',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    description: 'Tên của user',
    example: 'Văn A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    description: 'URL avatar của user',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiProperty({
    description: 'Ngày sinh của user',
    example: '1990-01-01',
    required: false,
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Giới tính của user',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Tiểu sử/giới thiệu của user',
    example: 'Tôi là một người yêu thích xe máy...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    description: 'Địa chỉ của user',
    example: '123 Đường ABC, Phường XYZ, Quận 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    description: 'ID thành phố',
    example: 'city-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({
    description: 'Mã bưu điện',
    example: '70000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @ApiProperty({
    description: 'Số điện thoại (update trong User table)',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
