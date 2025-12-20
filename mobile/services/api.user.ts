import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";
import { LoginResponse } from "@/types/auth.types";
import type { Vehicle } from "./api.vehicle";

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

  async addFavorite(vehicleId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.USER.ADD_FAVORITE.replace(":vehicleId", vehicleId)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Thêm vào yêu thích thất bại");
  },

  async removeFavorite(vehicleId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.USER.REMOVE_FAVORITE.replace(":vehicleId", vehicleId)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Xóa khỏi yêu thích thất bại");
  },

  async checkFavorite(vehicleId: string): Promise<{ isFavorite: boolean }> {
    const response = await apiClient.get<{ isFavorite: boolean }>(
      API_ENDPOINTS.USER.CHECK_FAVORITE.replace(":vehicleId", vehicleId)
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Kiểm tra yêu thích thất bại");
  },

  async getFavorites(): Promise<{ items: Vehicle[]; total: number }> {
    const response = await apiClient.get<{ items: Vehicle[]; total: number }>(
      API_ENDPOINTS.USER.GET_FAVORITES
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Lấy danh sách yêu thích thất bại");
  },
};
