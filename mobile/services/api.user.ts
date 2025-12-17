import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";
import { LoginResponse } from "@/types/auth.types";

export const apiUser = {
  async getUserInfo(): Promise<LoginResponse["user"]> {
    const response = await apiClient.get<LoginResponse["user"]>(
      API_ENDPOINTS.USER.GET_USER_INFO
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy thông tin thất bại");
  },
};
