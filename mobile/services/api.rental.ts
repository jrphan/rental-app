import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export type RentalStatus =
  | "PENDING_PAYMENT"
  | "AWAIT_APPROVAL"
  | "CONFIRMED"
  | "ON_TRIP"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface RentalUser {
  id: string;
  phone: string;
  email?: string | null;
  fullName?: string | null;
  avatar?: string | null;
}

export interface RentalVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  engineSize: number;
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    order: number;
  }[];
  pricePerDay: string;
  depositAmount: string;
  fullAddress: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
}

export interface RentalEvidence {
  id: string;
  url: string;
  type: string;
  order: number;
  note?: string | null;
  createdAt: string;
}

export interface Rental {
  id: string;
  renterId: string;
  ownerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  currency: string;
  pricePerDay: string;
  deliveryFee: string;
  discountAmount: string;
  totalPrice: string;
  depositPrice: string;
  platformFeeRatio: string;
  platformFee: string;
  ownerEarning: string;
  status: RentalStatus;
  startOdometer?: number | null;
  endOdometer?: number | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  renter: RentalUser;
  owner: RentalUser;
  vehicle: RentalVehicle;
  evidences: RentalEvidence[];
  deliveryAddress?: Record<string, any> | null;
  dispute?: {
    id: string;
    rentalId: string;
    reason: string;
    description?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface CreateRentalRequest {
  vehicleId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  deliveryFee?: number;
  discountAmount?: number;
  deliveryAddress?: Record<string, any>;
}

export interface CreateRentalResponse {
  message: string;
  rental: Rental;
}

export interface RentalListResponse {
  rentals: Rental[];
  total: number;
}

export interface RentalDetailResponse {
  rental: Rental;
}

export interface UpdateRentalStatusRequest {
  status: RentalStatus;
  cancelReason?: string;
}

export interface UpdateRentalStatusResponse {
  message: string;
  rental: Rental;
}

export type EvidenceType =
  | "PICKUP_FRONT"
  | "PICKUP_BACK"
  | "PICKUP_LEFT"
  | "PICKUP_RIGHT"
  | "PICKUP_DASHBOARD"
  | "RETURN_FRONT"
  | "RETURN_BACK"
  | "RETURN_LEFT"
  | "RETURN_RIGHT"
  | "RETURN_DASHBOARD"
  | "DAMAGE_DETAIL";

export interface UploadEvidenceRequest {
  type: EvidenceType;
  url: string;
  note?: string;
  order?: number;
}

export interface UploadMultipleEvidenceRequest {
  evidences: UploadEvidenceRequest[];
}

export interface UploadEvidenceResponse {
  message: string;
  evidence?: RentalEvidence;
  evidences?: RentalEvidence[];
}

export interface CreateDisputeRequest {
  reason: string;
  description?: string;
}

export interface CreateDisputeResponse {
  message: string;
  dispute: {
    id: string;
    rentalId: string;
    reason: string;
    description?: string | null;
    status: string;
    createdAt: string;
  };
  rental: Rental;
}

export const apiRental = {
  async createRental(data: CreateRentalRequest): Promise<CreateRentalResponse> {
    const response = await apiClient.post<CreateRentalResponse>(
      API_ENDPOINTS.RENTAL.CREATE,
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Tạo đơn thuê thất bại");
  },

  async getMyRentals(
    role?: "renter" | "owner" | "all",
    status?: RentalStatus
  ): Promise<RentalListResponse> {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (status) params.append("status", status);

    const url = `${API_ENDPOINTS.RENTAL.GET_MY_RENTALS}${params.toString() ? `?${params.toString()}` : ""}`;

    const response = await apiClient.get<RentalListResponse>(url);
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy danh sách đơn thuê thất bại");
  },

  async getRentalDetail(rentalId: string): Promise<RentalDetailResponse> {
    const response = await apiClient.get<RentalDetailResponse>(
      API_ENDPOINTS.RENTAL.GET_RENTAL_DETAIL.replace(":id", rentalId)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy chi tiết đơn thuê thất bại");
  },

  async updateRentalStatus(
    rentalId: string,
    data: UpdateRentalStatusRequest
  ): Promise<UpdateRentalStatusResponse> {
    const response = await apiClient.patch<UpdateRentalStatusResponse>(
      API_ENDPOINTS.RENTAL.UPDATE_RENTAL_STATUS.replace(":id", rentalId),
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(
      response.message || "Cập nhật trạng thái đơn thuê thất bại"
    );
  },

  async uploadEvidence(
    rentalId: string,
    data: UploadEvidenceRequest | UploadMultipleEvidenceRequest
  ): Promise<UploadEvidenceResponse> {
    const response = await apiClient.post<UploadEvidenceResponse>(
      API_ENDPOINTS.RENTAL.UPLOAD_EVIDENCE.replace(":id", rentalId),
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Upload evidence thất bại");
  },

  async createDispute(
    rentalId: string,
    data: CreateDisputeRequest
  ): Promise<CreateDisputeResponse> {
    const response = await apiClient.post<CreateDisputeResponse>(
      API_ENDPOINTS.RENTAL.CREATE_DISPUTE.replace(":id", rentalId),
      data
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Tạo dispute thất bại");
  },
};
