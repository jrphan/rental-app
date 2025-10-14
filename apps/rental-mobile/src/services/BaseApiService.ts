import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Import shared types from the backend
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

export class BaseApiService {
  protected axiosInstance: AxiosInstance;

  constructor(baseUrl: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          const headers: any = config.headers ?? {};
          if (typeof headers.set === 'function') {
            headers.set('Authorization', `Bearer ${token}`);
          } else {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          }
          config.headers = headers;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // Handle common errors
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
        }
        
        return Promise.reject(error);
      }
    );
  }

  protected async request<T>(
    config: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request(config);
      
      // Return the response data directly - it should already be in the correct format
      return response.data as ApiResponse<T>;
    } catch (error: any) {
      console.error('API Error:', error);
      
      // If the error has a response from the server, extract the error details
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // If it's already in our error format, throw it as is
        if (errorData.success === false) {
          throw errorData;
        }
        
        // Otherwise, create a structured error
        throw {
          success: false,
          message: errorData.message || 'Request failed',
          error: errorData.error || error.message || 'Unknown error',
          timestamp: new Date().toISOString(),
          path: errorData.path,
          statusCode: error.response.status,
        } as ApiErrorResponse;
      }
      
      // For network errors or other issues
      const errorMessage = error.message || 'Network error';
      throw {
        success: false,
        message: 'Network error',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        statusCode: 0,
      } as ApiErrorResponse;
    }
  }

  // Health check
  async healthCheck() {
    return this.request({
      url: '/health',
      method: 'GET',
    });
  }
}
