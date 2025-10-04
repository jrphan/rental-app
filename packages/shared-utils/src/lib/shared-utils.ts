/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  statusCode: number;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  message: string,
  data?: T,
  path?: string
): ApiResponse<T> & { success: true } {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  error: string,
  statusCode: number,
  path?: string
): ApiErrorResponse {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
    path,
    statusCode,
  };
}

/**
 * Create paginated response
 */
export interface PaginatedResponse<T> {
  success: true;
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
  path?: string;
}

export function createPaginatedResponse<T>(
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
  path?: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
    path,
  };
}

/**
 * Common response messages
 */
export const RESPONSE_MESSAGES = {
  // Success messages
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  
  // Error messages
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
} as const;

/**
 * HTTP Status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
