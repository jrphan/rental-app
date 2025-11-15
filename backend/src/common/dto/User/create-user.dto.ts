import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email của user',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Số điện thoại của user',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Mật khẩu của user',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Trạng thái hoạt động của user',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Trạng thái xác thực của user',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Vai trò của user',
    enum: UserRole,
    example: UserRole.RENTER,
    required: false,
    default: UserRole.RENTER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
