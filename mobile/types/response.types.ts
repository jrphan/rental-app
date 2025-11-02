/**
 * Response types cho mobile app
 * Được tạo dựa trên backend response interface
 */

/**
 * Interface cho response API thông thường
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

/**
 * Interface cho response API có phân trang
 */
export interface PaginatedResponse<T = any> {
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

/**
 * Interface cho pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * Type cho error response
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}

/**
 * Union type cho tất cả các loại response
 */
export type ResponseType<T = any> =
  | ApiResponse<T>
  | PaginatedResponse<T>
  | ErrorResponse;

/**
 * Type guard để kiểm tra response có thành công hay không
 */
export function isSuccessResponse<T>(
  response: ResponseType<T>
): response is ApiResponse<T> | PaginatedResponse<T> {
  return response.success === true;
}

/**
 * Type guard để kiểm tra response có phải là error hay không
 */
export function isErrorResponse<T>(
  response: ResponseType<T>
): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard để kiểm tra response có phải là paginated hay không
 */
export function isPaginatedResponse<T>(
  response: ResponseType<T>
): response is PaginatedResponse<T> {
  return "pagination" in response && response.success === true;
}
