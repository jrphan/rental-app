import { apiClient } from "./api";

export interface VehicleInput {
  vehicleTypeId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  engineSize?: number;
  fuelType?: "PETROL" | "ELECTRIC" | "HYBRID";
  transmission?: "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC";
  mileage?: number;
  description?: string;
  dailyRate: number;
  hourlyRate?: number;
  depositAmount: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  cityId?: string;
}

export interface VehicleItem {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  dailyRate: string;
  hourlyRate?: string | null;
  depositAmount: string;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const vehiclesApi = {
  async listPublic(params?: {
    cityId?: string;
    page?: number;
    limit?: number;
  }) {
    const s = new URLSearchParams();
    if (params?.cityId) s.set("cityId", params.cityId);
    if (params?.page) s.set("page", String(params.page));
    if (params?.limit) s.set("limit", String(params.limit));
    const res = await apiClient.get<Paginated<VehicleItem>>(
      `/vehicles${s.toString() ? `?${s.toString()}` : ""}`
    );
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Lấy danh sách xe thất bại");
  },

  async create(data: VehicleInput) {
    const res = await apiClient.post<VehicleItem>("/vehicles", data);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Tạo xe thất bại");
  },

  async update(id: string, data: Partial<VehicleInput>) {
    const res = await apiClient.put<VehicleItem>(`/vehicles/${id}`, data);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Cập nhật xe thất bại");
  },

  async submit(id: string) {
    const res = await apiClient.post<VehicleItem>(`/vehicles/${id}/submit`);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Gửi duyệt xe thất bại");
  },
};

export const rentalsApi = {
  async create(payload: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    pickupLocation?: string;
    returnLocation?: string;
    notes?: string;
  }) {
    const res = await apiClient.post<any>("/rentals", payload);
    if (res.success && res.data) return res.data;
    throw new Error(res.message || "Tạo đơn thuê thất bại");
  },
};
