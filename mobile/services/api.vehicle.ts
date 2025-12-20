import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";
import type { Vehicle, VehicleImage } from "@/screens/vehicles/types";

export interface CreateVehicleRequest {
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  engineSize: number;
  requiredLicense?: "A1" | "A2" | "A3" | "A4";
  cavetFront?: string;
  cavetBack?: string;
  description?: string;
  images: {
    url: string;
    isPrimary?: boolean;
    order?: number;
  }[];
  address: string;
  district?: string;
  city?: string;
  lat: number;
  lng: number;
  pricePerDay: number;
  depositAmount?: number;
  instantBook?: boolean;
}

export interface CreateVehicleResponse {
  message: string;
  vehicle: Vehicle;
}

export interface UserVehicleListResponse {
  items: Vehicle[];
  total: number;
}

export interface ChangeVehicleStatusRequest {
  status:
    | "DRAFT"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "MAINTENANCE"
    | "HIDDEN";
}

export interface ChangeVehicleStatusResponse {
  message: string;
  vehicle: Vehicle;
}

export const apiVehicle = {
  async create(data: CreateVehicleRequest): Promise<CreateVehicleResponse> {
    const response = await apiClient.post<CreateVehicleResponse>(
      API_ENDPOINTS.VEHICLE.CREATE,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Đăng ký xe thất bại");
  },

  async getMyVehicles(
    status?: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT"
  ): Promise<UserVehicleListResponse> {
    const params = status ? { status } : {};
    const response = await apiClient.get<UserVehicleListResponse>(
      API_ENDPOINTS.VEHICLE.LIST_MY_VEHICLES,
      { params }
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy danh sách xe thất bại");
  },

  async getMyVehicleDetail(id: string): Promise<Vehicle> {
    const response = await apiClient.get<Vehicle>(
      API_ENDPOINTS.VEHICLE.GET_MY_VEHICLE_DETAIL.replace(":id", id)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy thông tin xe thất bại");
  },

  async getVehicleDetail(id: string): Promise<Vehicle> {
    const response = await apiClient.get<Vehicle>(
      API_ENDPOINTS.VEHICLE.GET_VEHICLE_DETAIL.replace(":id", id)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy thông tin xe thất bại");
  },

  async updateVehicle(
    id: string,
    data: CreateVehicleRequest
  ): Promise<CreateVehicleResponse> {
    const response = await apiClient.put<CreateVehicleResponse>(
      API_ENDPOINTS.VEHICLE.UPDATE_VEHICLE.replace(":id", id),
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Cập nhật thông tin xe thất bại");
  },

  async updateVehicleStatus(
    id: string,
    data: ChangeVehicleStatusRequest
  ): Promise<ChangeVehicleStatusResponse> {
    const response = await apiClient.patch<ChangeVehicleStatusResponse>(
      API_ENDPOINTS.VEHICLE.UPDATE_VEHICLE_STATUS.replace(":id", id),
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Thay đổi trạng thái xe thất bại");
  },
};
