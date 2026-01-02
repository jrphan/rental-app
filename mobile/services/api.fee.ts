import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export interface FeeSettingsResponse {
  id: string;
  deliveryFeePerKm: string;
  insuranceRate50cc: string;
  insuranceRateTayGa: string;
  insuranceRateTayCon: string;
  insuranceRateMoto: string;
  insuranceRateDefault: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const apiFee = {
  async getFeeSettings(): Promise<FeeSettingsResponse> {
    const response = await apiClient.get<FeeSettingsResponse>(
      API_ENDPOINTS.FEE_SETTINGS
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy cài đặt phí thất bại");
  },
};

