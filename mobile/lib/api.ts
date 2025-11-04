import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  // PaginatedResponse,
  ErrorResponse,
  ResponseType,
  createErrorResponse,
  logResponse,
  validateResponse,
} from "@/types";
import { getAuthCache } from "@/store/auth";
import { resolveApiUrl } from "./utils";

// Ưu tiên dùng biến môi trường Expo: EXPO_PUBLIC_API_URL
// Tự động resolve localhost thành IP network khi chạy trên thiết bị thật
const rawBaseURL = process.env.EXPO_PUBLIC_API_URL || "";
const baseURL = resolveApiUrl(rawBaseURL);

export const api = axios.create({
  baseURL,
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  // Gắn thêm header mặc định nếu cần
  config.headers = config.headers ?? {};
  // Thiết lập từng trường để khớp kiểu AxiosHeaders
  (config.headers as any)["Accept"] =
    (config.headers as any)["Accept"] ?? "application/json";

  // Không ép Content-Type khi gửi FormData (để axios tự set boundary)
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (isFormData) {
    // Xóa nếu lỡ set từ trước
    delete (config.headers as any)["Content-Type"];
  } else if (!(config.headers as any)["Content-Type"]) {
    (config.headers as any)["Content-Type"] = "application/json";
  }

  // Thêm token vào header nếu có
  const authData = getAuthCache();
  if (authData?.token) {
    config.headers.Authorization = `Bearer ${authData.token}`;
  }

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
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status || 500;
    const responseData = error.response?.data as any;

    // Nếu lỗi 401 và chưa retry, thử refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authData = getAuthCache();

      if (authData?.refreshToken) {
        try {
          // Lazy import để tránh circular dependency
          const { authApi } = await import("./api.auth");
          // Refresh token
          const tokens = await authApi.refreshToken(authData.refreshToken);

          // Update cache và headers
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }

          // Update store
          const { useAuthStore } = await import("@/store/auth");
          useAuthStore.getState().updateTokens(tokens);

          // Retry original request
          return api(originalRequest);
        } catch {
          // Refresh thất bại, logout
          const { useAuthStore } = await import("@/store/auth");
          useAuthStore.getState().logout();
          // Redirect to login
          if (typeof window !== "undefined") {
            // This will be handled by navigation guards
          }
        }
      }
    }

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
