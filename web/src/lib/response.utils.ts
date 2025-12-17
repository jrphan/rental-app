/**
 * Response utilities cho web app
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
} from '@/types/response.types'

/**
 * Extract data từ response thành công
 */
export function extractData<T>(response: ResponseType<T>): T | T[] | null {
  if (isSuccessResponse(response)) {
    return response.data || null
  }
  return null
}

/**
 * Extract message từ response
 */
export function extractMessage<T>(response: ResponseType<T>): string {
  return response.message || ''
}

/**
 * Extract error message từ response
 */
export function extractErrorMessage<T>(response: ResponseType<T>): string {
  if (isErrorResponse(response)) {
    return response.error || response.message || 'Đã xảy ra lỗi'
  }
  return ''
}

/**
 * Extract pagination info từ paginated response
 */
export function extractPagination<T>(response: ResponseType<T>) {
  if (isPaginatedResponse(response)) {
    return response.pagination
  }
  return null
}

/**
 * Kiểm tra response có thành công hay không
 */
export function isApiSuccess<T>(response: ResponseType<T>): boolean {
  return isSuccessResponse(response)
}

/**
 * Kiểm tra response có phải là error hay không
 */
export function isApiError<T>(response: ResponseType<T>): boolean {
  return isErrorResponse(response)
}

/**
 * Kiểm tra response có phải là paginated hay không
 */
export function isApiPaginated<T>(response: ResponseType<T>): boolean {
  return isPaginatedResponse(response)
}

/**
 * Tạo error response từ error object
 */
export function createErrorResponse(
  error: any,
  path: string = '',
): ErrorResponse {
  return {
    success: false,
    message: error.message || 'Đã xảy ra lỗi',
    error: error.error || error.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    path,
    statusCode: error.statusCode || error.status || 500,
  }
}

/**
 * Tạo success response từ data
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = 'Thành công',
  path: string = '',
  statusCode: number = 200,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  }
}

/**
 * Tạo paginated response từ data và pagination info
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  },
  message: string = 'Lấy danh sách thành công',
  path: string = '',
  statusCode: number = 200,
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  }
}

/**
 * Log response để debug
 */
export function logResponse<T>(
  response: ResponseType<T>,
  label: string = 'API Response',
) {
  if (process.env.NODE_ENV === 'development') {
    const isSuccess = response.success
    const emoji = isSuccess ? '✅' : '❌'
    const statusEmoji = isSuccess ? '🟢' : '🔴'

    console.group(`${emoji} ${label} ${statusEmoji}`)

    // Status và message
    if (isSuccess) {
      console.log(`✅ Success: ${response.message || 'Thành công'}`)
    } else {
      console.log('❌ Error:', `${response?.message || 'Đã xảy ra lỗi'}`)
    }

    // Status code với màu
    const statusColor = response.statusCode >= 400 ? '🔴' : '🟢'
    console.log(`${statusColor} Status: ${response.statusCode}`)

    // Path
    console.log(`📍 Path: ${response.path || 'N/A'}`)

    // Timestamp
    console.log(`🕐 Time: ${response.timestamp || 'N/A'}`)

    // Data (nếu có)
    if (isSuccessResponse(response) && response.data !== undefined) {
      const data = response.data
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        console.log('📦 Data:', JSON.stringify(data, null, 2))
      } else {
        console.log('📦 Data:', data)
      }
    }

    // Error (nếu có)
    if (isErrorResponse(response) && response?.error) {
      console.log('❌ Error:', JSON.stringify(response, null, 2))
    }

    // Pagination (nếu có)
    if (isPaginatedResponse(response) && response?.pagination) {
      console.log('📄 Pagination:', response?.pagination)
      console.log('') // Khoảng cách
    }

    console.log('----------------------------------------------------')
    console.groupEnd()
  }
}

/**
 * Validate response structure theo format từ backend
 * Backend ResponseInterceptor và HttpExceptionFilter trả về format:
 * - Success: { success: true, message: string, data?: T, timestamp: string, path: string, statusCode: number }
 * - Error: { success: false, message: string, error?: string, timestamp: string, path: string, statusCode: number, ...extra }
 */
export function validateResponse<T>(
  response: any,
): response is ResponseType<T> {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string' &&
    typeof response.timestamp === 'string' &&
    typeof response.path === 'string' &&
    typeof response.statusCode === 'number'
  )
}

/**
 * Safe extract data với fallback
 */
export function safeExtractData<T>(
  response: ResponseType<T>,
  fallback: T | T[] | null = null,
): T | T[] | null {
  try {
    return extractData(response) || fallback
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error extracting data from response:', error)
    }
    return fallback
  }
}

/**
 * Safe extract message với fallback
 */
export function safeExtractMessage<T>(
  response: ResponseType<T>,
  fallback: string = 'Đã xảy ra lỗi',
): string {
  try {
    return extractMessage(response) || fallback
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error extracting message from response:', error)
    }
    return fallback
  }
}
