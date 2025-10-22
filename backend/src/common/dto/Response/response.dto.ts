import { ApiProperty } from '@nestjs/swagger';
import {
  ApiResponse,
  PaginatedResponse,
} from '@/common/interfaces/Response/response.interface';

export class ApiResponseDto<T = any> implements ApiResponse<T> {
  @ApiProperty({
    description: 'Trạng thái thành công của request',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo mô tả kết quả',
    example: 'Thành công',
  })
  message: string;

  @ApiProperty({ description: 'Dữ liệu trả về', required: false })
  data?: T;

  @ApiProperty({ description: 'Thông báo lỗi', required: false })
  error?: string;

  @ApiProperty({
    description: 'Thời gian phản hồi',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Đường dẫn API được gọi', example: '/api/users' })
  path: string;

  @ApiProperty({ description: 'Mã trạng thái HTTP', example: 200 })
  statusCode: number;
}

export class PaginatedResponseDto<T = any> implements PaginatedResponse<T> {
  @ApiProperty({
    description: 'Trạng thái thành công của request',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Thông báo mô tả kết quả',
    example: 'Lấy danh sách thành công',
  })
  message: string;

  @ApiProperty({ description: 'Mảng dữ liệu trả về', type: [Object] })
  data: T[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1, description: 'Trang hiện tại' },
      limit: {
        type: 'number',
        example: 10,
        description: 'Số lượng item trên mỗi trang',
      },
      total: { type: 'number', example: 100, description: 'Tổng số item' },
      totalPages: { type: 'number', example: 10, description: 'Tổng số trang' },
      hasNext: {
        type: 'boolean',
        example: true,
        description: 'Có trang tiếp theo',
      },
      hasPrev: {
        type: 'boolean',
        example: false,
        description: 'Có trang trước đó',
      },
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Thời gian phản hồi',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Đường dẫn API được gọi', example: '/api/users' })
  path: string;

  @ApiProperty({ description: 'Mã trạng thái HTTP', example: 200 })
  statusCode: number;
}
