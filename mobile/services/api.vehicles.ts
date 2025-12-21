/**
 * Types và API cho tìm kiếm và thuê xe (public)
 * Dùng cho người dùng tìm kiếm và thuê xe
 */

export interface VehicleItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  dailyRate: number; // Giá thuê/ngày
  depositAmount?: number; // Tiền cọc
  status?: "VERIFIED" | "PENDING" | "REJECTED"; // Trạng thái xe
  fuelType?: "PETROL" | "ELECTRIC" | "HYBRID"; // Loại nhiên liệu
  transmission?: "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC"; // Hộp số
  images?: {
    id: string;
    url: string;
    alt?: string | null;
    isPrimary: boolean;
  }[];
}

