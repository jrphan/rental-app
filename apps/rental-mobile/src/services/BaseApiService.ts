import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
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
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      console.error('API Error:', errorMessage);
      throw new Error(errorMessage);
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
