import { apiClient } from "./api";

export interface VehicleType {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInput {
  vehicleTypeId?: string; // Optional - backend sẽ tự động set "motorcycle"
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
  fuelType?: "PETROL" | "ELECTRIC" | "HYBRID";
  transmission?: "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC";
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
  async getTypes() {
    const res = await apiClient.get<VehicleType[]>("/vehicles/types");
    if (res.success) {
      if (Array.isArray(res.data)) return res.data;
      const wrapped = res.data as any;
      if (wrapped && Array.isArray(wrapped.data)) return wrapped.data;
      if (wrapped && Array.isArray(wrapped.items)) return wrapped.items;
    }
    throw new Error(res.message || "Lấy danh sách loại xe thất bại");
  },

  async createType(data: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    const res = await apiClient.post<VehicleType>("/vehicles/types", data);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Tạo loại xe thất bại");
  },

  async getMyVehicles() {
    const res = await apiClient.get<VehicleItem[]>("/vehicles/my");
    if (res.success) {
      if (Array.isArray(res.data)) return res.data;
      const wrapped = res.data as any;
      if (wrapped && Array.isArray(wrapped.data)) return wrapped.data;
      if (wrapped && Array.isArray(wrapped.items)) return wrapped.items;
    }
    throw new Error(res.message || "Lấy danh sách xe thất bại");
  },

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

  async getById(id: string) {
    const res = await apiClient.get<
      VehicleItem & {
        images?: {
          id: string;
          url: string;
          alt?: string | null;
          isPrimary: boolean;
        }[];
        vehicleType?: {
          id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
        };
      }
    >(`/vehicles/${id}`);
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Lấy thông tin xe thất bại");
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

  // Vehicle Images
  async addImage(vehicleId: string, url: string, alt?: string) {
    const res = await apiClient.post<{
      id: string;
      vehicleId: string;
      url: string;
      alt?: string | null;
      isPrimary: boolean;
      order: number;
    }>(`/vehicles/${vehicleId}/images`, { url, alt });
    if (res.success && res.data && !Array.isArray(res.data)) return res.data;
    throw new Error(res.message || "Thêm hình ảnh thất bại");
  },

  async removeImage(vehicleId: string, imageId: string) {
    const res = await apiClient.delete(
      `/vehicles/${vehicleId}/images/${imageId}`
    );
    if (res.success) return;
    throw new Error(res.message || "Xóa hình ảnh thất bại");
  },

  async getImages(vehicleId: string) {
    const res = await apiClient.get<
      {
        id: string;
        vehicleId: string;
        url: string;
        alt?: string | null;
        isPrimary: boolean;
        order: number;
        createdAt: string;
      }[]
    >(`/vehicles/${vehicleId}/images`);
    if (res.success) {
      if (Array.isArray(res.data)) return res.data;
      const wrapped = res.data as any;
      if (wrapped && Array.isArray(wrapped.data)) return wrapped.data;
    }
    throw new Error(res.message || "Lấy hình ảnh thất bại");
  },

  async delete(id: string) {
    const res = await apiClient.delete(`/vehicles/${id}`);
    if (res.success) return;
    throw new Error(res.message || "Xóa xe thất bại");
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
