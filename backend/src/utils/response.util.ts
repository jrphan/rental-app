import { PaginatedResponse } from '@/types/response.type';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function createPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message: string = 'Lấy danh sách thành công',
  path: string = '',
): PaginatedResponse<T> {
  const totalPages = Math.ceil(meta.total / meta.limit);

  return {
    success: true,
    message,
    data,
    pagination: {
      page: meta.page,
      limit: meta.limit,
      total: meta.total,
      totalPages,
      hasNext: meta.page < totalPages,
      hasPrev: meta.page > 1,
    },
    timestamp: new Date().toISOString(),
    path,
    statusCode: 200,
  };
}

export function createResponse<T>(
  data: T,
  message: string = 'Thành công',
  path: string = '',
  statusCode: number = 200,
) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  };
}
