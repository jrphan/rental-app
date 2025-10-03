/**
 * Base interface for all API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
  path: string;
  statusCode: number;
}

/**
 * Error details interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Success response data wrapper
 */
export interface SuccessData<T = any> {
  items?: T[];
  item?: T;
  meta?: ResponseMeta;
}

/**
 * Response metadata for pagination and filtering
 */
export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

/**
 * Request context for responses
 */
export interface RequestContext {
  path: string;
  method: string;
  userId?: string;
  requestId?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  value: any;
  message: string;
  errors?: string[];
}
