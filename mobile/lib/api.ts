import { router } from "expo-router";
import { getAuthCache, useAuthStore } from "@/store/auth";
import {
  createErrorResponse,
  validateResponse,
  logResponse,
} from "@/lib/response.utils";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  ErrorResponse,
  ResponseType,
} from "@/types/response.types";
import {
  forceLogoutState,
  matchesForceLogoutMessage,
} from "@/lib/force-logout";
import ROUTES from "@/constants/routes";
import API_ENDPOINTS from "@/services/api.endpoints";
import { queryClient } from "@/lib/queryClient";

const baseURL = process.env.EXPO_PUBLIC_API_URL || "";

const forceLogoutAndRedirect = async (reason?: string) => {
  if (forceLogoutState.isForceLoggingOut) {
    return;
  }

  forceLogoutState.isForceLoggingOut = true;

  if (reason) {
    console.warn(`[API] Force logout: ${reason}`);
  }

  try {
    // Xóa cache React Query trước khi logout
    queryClient.clear();
    useAuthStore.getState().logout();
  } finally {
    setTimeout(() => {
      try {
        router.replace(ROUTES.LOGIN);
      } catch (navError) {
        console.warn("Failed to redirect to login", navError);
      } finally {
        forceLogoutState.isForceLoggingOut = false;
      }
    }, 0);
  }
};

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

  // Xác định các endpoint public (không cần token)
  const url = config.url || "";
  const isPublicAuthRequest =
    url.includes(API_ENDPOINTS.AUTH.LOGIN) ||
    url.includes(API_ENDPOINTS.AUTH.REGISTER) ||
    url.includes(API_ENDPOINTS.AUTH.FORGOT_PASSWORD) ||
    url.includes(API_ENDPOINTS.AUTH.VERIFY_RESET_PASSWORD) ||
    url.includes(API_ENDPOINTS.AUTH.VERIFY_OTP) ||
    url.includes(API_ENDPOINTS.AUTH.RESEND_OTP) ||
    url === API_ENDPOINTS.HEALTH;

  // Thêm token vào header nếu có và không phải request public
  // Note: Nếu token hết hạn, response interceptor sẽ tự động refresh và retry
  const authData = getAuthCache();
  if (authData?.token && !isPublicAuthRequest) {
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
    const authData = getAuthCache();
    const requestUrl = originalRequest?.url || "";
    const isRefreshRequest = requestUrl.includes(API_ENDPOINTS.AUTH.REFRESH);
    const isPublicAuthRequest =
      requestUrl.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.REGISTER) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.FORGOT_PASSWORD) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.VERIFY_RESET_PASSWORD) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.VERIFY_OTP) ||
      requestUrl.includes(API_ENDPOINTS.AUTH.RESEND_OTP) ||
      requestUrl === API_ENDPOINTS.HEALTH;

    // Nếu lỗi 401 và chưa retry, thử refresh token
    // Bỏ qua cho các request public (login/register/forgot/verify...) để tránh redirect lại và reset form
    if (
      status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true;

      if (authData?.refreshToken) {
        try {
          // Lazy import để tránh circular dependency
          const { authApi } = await import("../services/api.auth");
          // Refresh token
          const refreshResponse = await authApi.refreshToken(
            authData.refreshToken
          );

          // Update cache và headers
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`;
          }

          // Update store với tokens
          useAuthStore.getState().updateTokens({
            accessToken: refreshResponse.accessToken,
            refreshToken: refreshResponse.refreshToken,
          });

          // Update user nếu có trong response
          if (refreshResponse.user) {
            useAuthStore.getState().updateUser({
              ...refreshResponse.user,
              role: refreshResponse.user.role as any, // Backend trả về string, nhưng store cần UserRole
            });
          }

          // Retry original request
          return api(originalRequest);
        } catch {
          // Refresh thất bại, logout
          await forceLogoutAndRedirect("refresh_token_failed");
        }
      } else {
        // No refresh token, force logout
        await forceLogoutAndRedirect("no_refresh_token");
      }
    }

    let errorResponse: ErrorResponse;

    if (responseData && validateResponse(responseData)) {
      // Nếu error response đã đúng format từ backend
      // Backend HttpExceptionFilter trả về: { success: false, message, error, timestamp, path, statusCode, ...extra }
      errorResponse = responseData as ErrorResponse;
    } else {
      // Tạo error response mới nếu backend chưa format (shouldn't happen với HttpExceptionFilter)
      errorResponse = createErrorResponse(
        {
          message: responseData?.message || error.message || "Đã xảy ra lỗi",
          error: responseData?.error || error.message || "Unknown error",
          statusCode: status,
        },
        error.config?.url || ""
      );
    }

    logResponse(errorResponse, "API Error");

    const serverMessage =
      typeof responseData?.message === "string"
        ? responseData.message
        : undefined;
    const shouldForceLogout =
      status === 401 &&
      authData &&
      !isPublicAuthRequest &&
      (isRefreshRequest || matchesForceLogoutMessage(serverMessage));

    if (shouldForceLogout) {
      await forceLogoutAndRedirect(serverMessage || "unauthorized");
    }

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
