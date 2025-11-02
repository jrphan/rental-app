/**
 * API types cho mobile app
 * Định nghĩa các type cho API endpoints và request/response
 */

import { ApiResponse, PaginatedResponse } from "./response.types";

/**
 * Base API endpoint types
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Generic API request type
 */
export interface ApiRequest<T = any> {
  data?: T;
  params?: Record<string, any>;
  query?: Record<string, any>;
}

/**
 * Generic API response type
 */
export type ApiResponseType<T = any> = ApiResponse<T>;

/**
 * Generic paginated API response type
 */
export type PaginatedApiResponseType<T = any> = PaginatedResponse<T>;

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  requiresAuth?: boolean;
}

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: { method: "POST" as const, path: "/auth/login" },
    REGISTER: { method: "POST" as const, path: "/auth/register" },
    REFRESH: { method: "POST" as const, path: "/auth/refresh" },
    LOGOUT: { method: "POST" as const, path: "/auth/logout" },
    PROFILE: {
      method: "GET" as const,
      path: "/auth/profile",
      requiresAuth: true,
    },
  },

  // User endpoints
  USERS: {
    LIST: { method: "GET" as const, path: "/users" },
    CREATE: { method: "POST" as const, path: "/users" },
    GET: { method: "GET" as const, path: "/users/:id" },
    UPDATE: { method: "PUT" as const, path: "/users/:id" },
    DELETE: { method: "DELETE" as const, path: "/users/:id" },
  },

  // Property endpoints (ví dụ cho rental app)
  PROPERTIES: {
    LIST: { method: "GET" as const, path: "/properties" },
    CREATE: { method: "POST" as const, path: "/properties" },
    GET: { method: "GET" as const, path: "/properties/:id" },
    UPDATE: { method: "PUT" as const, path: "/properties/:id" },
    DELETE: { method: "DELETE" as const, path: "/properties/:id" },
  },
} as const;

/**
 * Type cho pagination query parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Type cho search query parameters
 */
export interface SearchQuery extends PaginationQuery {
  search?: string;
  filters?: Record<string, any>;
}

/**
 * Type cho API error
 */
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp: string;
  path: string;
}

/**
 * Type cho authentication request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

/**
 * Type cho authentication response
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Type cho user data
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type cho property data (ví dụ cho rental app)
 */
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  images: string[];
  features: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type cho API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Type cho API client methods
 */
export interface ApiClient {
  get<T>(url: string, config?: any): Promise<ApiResponseType<T>>;
  post<T>(url: string, data?: any, config?: any): Promise<ApiResponseType<T>>;
  put<T>(url: string, data?: any, config?: any): Promise<ApiResponseType<T>>;
  patch<T>(url: string, data?: any, config?: any): Promise<ApiResponseType<T>>;
  delete<T>(url: string, config?: any): Promise<ApiResponseType<T>>;
}
