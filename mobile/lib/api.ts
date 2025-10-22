import axios, { AxiosError } from "axios";

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
  (response) => response,
  (error: AxiosError) => {
    // Chuẩn hóa thông báo lỗi nhằm dễ debug
    const status = error.response?.status;
    const message = (error.response?.data as any)?.message || error.message;
    // Có thể log ra Sentry/console tại đây
    if (__DEV__) {
      console.warn("API error:", status, message);
    }
    return Promise.reject(error);
  }
);
