import axios, { AxiosError, AxiosResponse } from "axios";
import {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ResponseType,
  createErrorResponse,
  logResponse,
  validateResponse,
} from "@/types";

// Ưu tiên dùng biến môi trường Expo: EXPO_PUBLIC_API_URL
const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  // Gắn thêm header mặc định nếu cần
  config.headers = config.headers ?? {};
  // Thiết lập từng trường để khớp kiểu AxiosHeaders
  (config.headers as any)["Accept"] = "application/json";
  (config.headers as any)["Content-Type"] = "application/json";
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Validate response structure
    if (validateResponse(response.data)) {
      logResponse(response.data, "API Success");
      return response;
    } else {
      // Nếu response không đúng format, wrap lại
      const wrappedResponse: ApiResponse = {
        success: true,
        message: "Thành công",
        data: response.data,
        timestamp: new Date().toISOString(),
        path: response.config.url || "",
        statusCode: response.status,
      };
      logResponse(wrappedResponse, "API Success (Wrapped)");
      return { ...response, data: wrappedResponse };
    }
  },
  (error: AxiosError) => {
    // Chuẩn hóa thông báo lỗi nhằm dễ debug
    const status = error.response?.status || 500;
    const responseData = error.response?.data as any;

    let errorResponse: ErrorResponse;

    if (responseData && validateResponse(responseData)) {
      // Nếu error response đã đúng format
      errorResponse = responseData as ErrorResponse;
    } else {
      // Tạo error response mới
      errorResponse = createErrorResponse(
        {
          message: responseData?.message || error.message || "Đã xảy ra lỗi",
          statusCode: status,
        },
        error.config?.url || ""
      );
    }

    logResponse(errorResponse, "API Error");

    // Reject với error response đã được format
    return Promise.reject(errorResponse);
  }
);

/**
 * Typed API methods với response types
 */
export const apiClient = {
  async get<T>(url: string, config?: any): Promise<ResponseType<T>> {
    const response = await api.get(url, config);
    return response.data;
  },

  async post<T>(
    url: string,
    data?: any,
    config?: any
  ): Promise<ResponseType<T>> {
    const response = await api.post(url, data, config);
    return response.data;
  },

  async put<T>(
    url: string,
    data?: any,
    config?: any
  ): Promise<ResponseType<T>> {
    const response = await api.put(url, data, config);
    return response.data;
  },

  async patch<T>(
    url: string,
    data?: any,
    config?: any
  ): Promise<ResponseType<T>> {
    const response = await api.patch(url, data, config);
    return response.data;
  },

  async delete<T>(url: string, config?: any): Promise<ResponseType<T>> {
    const response = await api.delete(url, config);
    return response.data;
  },
};
