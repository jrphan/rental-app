import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryUserDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm user theo email hoặc phone',
    example: 'john',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Lọc user theo vai trò',
    example: 'USER',
    required: false,
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    description: 'Lọc user theo trạng thái hoạt động',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiProperty({
    description: 'Số trang',
    example: 1,
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng user trên mỗi trang',
    example: 10,
    minimum: 1,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
