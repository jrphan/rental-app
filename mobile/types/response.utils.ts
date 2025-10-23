/**
 * Response utilities cho mobile app
 * Các hàm tiện ích để xử lý response từ API
 */

import {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ResponseType,
  isSuccessResponse,
  isErrorResponse,
  isPaginatedResponse,
} from "./response.types";

/**
 * Extract data từ response thành công
 */
export function extractData<T>(response: ResponseType<T>): T | T[] | null {
  if (isSuccessResponse(response)) {
    return response.data || null;
  }
  return null;
}

/**
 * Extract message từ response
 */
export function extractMessage<T>(response: ResponseType<T>): string {
  return response.message || "";
}

/**
 * Extract error message từ response
 */
export function extractErrorMessage<T>(response: ResponseType<T>): string {
  if (isErrorResponse(response)) {
    return response.error || response.message || "Đã xảy ra lỗi";
  }
  return "";
}

/**
 * Extract pagination info từ paginated response
 */
export function extractPagination<T>(response: ResponseType<T>) {
  if (isPaginatedResponse(response)) {
    return response.pagination;
  }
  return null;
}

/**
 * Kiểm tra response có thành công hay không
 */
export function isApiSuccess<T>(response: ResponseType<T>): boolean {
  return isSuccessResponse(response);
}

/**
 * Kiểm tra response có phải là error hay không
 */
export function isApiError<T>(response: ResponseType<T>): boolean {
  return isErrorResponse(response);
}

/**
 * Kiểm tra response có phải là paginated hay không
 */
export function isApiPaginated<T>(response: ResponseType<T>): boolean {
  return isPaginatedResponse(response);
}

/**
 * Tạo error response từ error object
 */
export function createErrorResponse(
  error: any,
  path: string = ""
): ErrorResponse {
  return {
    success: false,
    message: error.message || "Đã xảy ra lỗi",
    error: error.error || error.message || "Unknown error",
    timestamp: new Date().toISOString(),
    path,
    statusCode: error.statusCode || error.status || 500,
  };
}

/**
 * Tạo success response từ data
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = "Thành công",
  path: string = "",
  statusCode: number = 200
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  };
}

/**
 * Tạo paginated response từ data và pagination info
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  message: string = "Lấy danh sách thành công",
  path: string = "",
  statusCode: number = 200
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  };
}

/**
 * Format response để hiển thị trong UI
 */
export function formatResponseForUI<T>(response: ResponseType<T>) {
  if (isSuccessResponse(response)) {
    return {
      success: true,
      message: response.message,
      data: response.data,
      timestamp: response.timestamp,
    };
  }

  return {
    success: false,
    message: response.message,
    error: isErrorResponse(response) ? response.error : undefined,
    timestamp: response.timestamp,
  };
}

/**
 * Log response để debug
 */
export function logResponse<T>(
  response: ResponseType<T>,
  label: string = "API Response"
) {
  if (__DEV__) {
    console.log(`[${label}]`, {
      success: response.success,
      message: response.message,
      statusCode: response.statusCode,
      path: response.path,
      timestamp: response.timestamp,
      data: isSuccessResponse(response)
        ? (response as ApiResponse<T>).data
        : undefined,
      error: isErrorResponse(response)
        ? (response as ErrorResponse).error
        : undefined,
      pagination: isPaginatedResponse(response)
        ? (response as PaginatedResponse<T>).pagination
        : undefined,
    });
  }
}

/**
 * Validate response structure
 */
export function validateResponse<T>(
  response: any
): response is ResponseType<T> {
  return (
    response &&
    typeof response === "object" &&
    typeof response.success === "boolean" &&
    typeof response.message === "string" &&
    typeof response.timestamp === "string" &&
    typeof response.path === "string" &&
    typeof response.statusCode === "number"
  );
}

/**
 * Safe extract data với fallback
 */
export function safeExtractData<T>(
  response: ResponseType<T>,
  fallback: T | T[] | null = null
): T | T[] | null {
  try {
    return extractData(response) || fallback;
  } catch (error) {
    if (__DEV__) {
      console.warn("Error extracting data from response:", error);
    }
    return fallback;
  }
}

/**
 * Safe extract message với fallback
 */
export function safeExtractMessage<T>(
  response: ResponseType<T>,
  fallback: string = "Đã xảy ra lỗi"
): string {
  try {
    return extractMessage(response) || fallback;
  } catch (error) {
    if (__DEV__) {
      console.warn("Error extracting message from response:", error);
    }
    return fallback;
  }
}
