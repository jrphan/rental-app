import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse, ErrorResponse } from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Export api for direct use (e.g., refresh token to avoid interceptor loop)
export { api as apiDirect }

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // If response has the expected format, return it
    if (response.data && typeof response.data === 'object') {
      return response
    }
    // Wrap response if needed
    const wrappedResponse: ApiResponse<any> = {
      success: true,
      message: 'Thành công',
      data: response.data,
      timestamp: new Date().toISOString(),
      path: response.config.url || '',
      statusCode: response.status,
    }
    return { ...response, data: wrappedResponse }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const status = error.response?.status || 500
    const responseData = error.response?.data as any

    // Handle 401 - Unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          // Try to refresh token
          const tokens = await api.post('/auth/refresh', { refreshToken })
          if (tokens.data?.success && tokens.data?.data) {
            const newTokens = tokens.data.data
            localStorage.setItem('accessToken', newTokens.accessToken)
            if (newTokens.refreshToken) {
              localStorage.setItem('refreshToken', newTokens.refreshToken)
            }
            // Update store with new tokens
            if (typeof window !== 'undefined') {
              const { authActions } = await import('@/store/auth')
              authActions.updateTokens(newTokens)
            }
            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
            }
            return api(originalRequest)
          }
        } catch {
          // Refresh failed, logout
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          // Redirect to login
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login'
          }
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login'
        }
      }
    }

    // Format error response
    let errorResponse: ErrorResponse
    if (responseData && responseData.message) {
      errorResponse = {
        success: false,
        message: responseData.message || 'Đã xảy ra lỗi',
        statusCode: status,
        timestamp: responseData.timestamp || new Date().toISOString(),
        path: responseData.path || originalRequest?.url || '',
      }
    } else {
      errorResponse = {
        success: false,
        message: error.message || 'Đã xảy ra lỗi',
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: originalRequest?.url || '',
      }
    }

    return Promise.reject(errorResponse)
  },
)

/**
 * Typed API client methods
 */
export const apiClient = {
  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(url, config)
    return response.data
  },

  async post<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data, config)
    return response.data
  },

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data, config)
    return response.data
  },

  async patch<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const response = await api.patch<ApiResponse<T>>(url, data, config)
    return response.data
  },

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(url, config)
    return response.data
  },
}
