/**
 * Standard API Response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  timestamp?: string
  path?: string
  statusCode?: number
}

/**
 * Error Response format
 */
export interface ErrorResponse {
  success: false
  message: string
  statusCode: number
  timestamp?: string
  path?: string
}

/**
 * Auth Response types
 */
export interface AuthResponse {
  user: {
    id: string
    email: string
    phone?: string
    role: string
    isActive: boolean
    isVerified: boolean
    createdAt: string
    updatedAt: string
  }
  accessToken: string
  refreshToken?: string
}

export interface LoginInput {
  email: string
  password: string
}

