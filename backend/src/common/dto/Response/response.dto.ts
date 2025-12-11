import { ApiResponse, PaginatedResponse } from '@/types/response.type';

export class ApiResponseDto<T = any> implements ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

export class PaginatedResponseDto<T = any> implements PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
  path: string;
  statusCode: number;
}
