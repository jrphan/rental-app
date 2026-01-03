import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export interface OwnerCommission {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalEarning: string;
  commissionRate: string;
  commissionAmount: string;
  rentalCount: number;
  paymentStatus: "PENDING" | "PAID" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  payment?: CommissionPayment;
}

export interface CommissionPayment {
  id: string;
  commissionId: string;
  ownerId: string;
  amount: string;
  invoiceUrl: string | null;
  status: "PENDING" | "PAID" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  paidAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerCommissionListResponse {
  items: OwnerCommission[];
  total: number;
}

export interface UploadInvoiceRequest {
  invoiceFileId: string;
}

export interface RevenueItem {
  id: string;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  startDate: string;
  endDate: string;
  ownerEarning: string;
  totalPrice: string;
  platformFee?: string; // Phí nền tảng
  deliveryFee?: string; // Phí giao xe
  insuranceFee?: string; // Phí bảo hiểm
  discountAmount?: string; // Giảm giá
  status: string;
  createdAt: string;
}

export interface RevenueResponse {
  items: RevenueItem[];
  total: number;
  totalRevenue: string;
  totalEarning: string;
}

export const apiCommission = {
  async getMyCommissions(
    limit?: number,
    offset?: number
  ): Promise<OwnerCommissionListResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const url = `${API_ENDPOINTS.USER.MY_COMMISSIONS}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<OwnerCommissionListResponse>(url);

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy danh sách commission thất bại");
  },

  async getRevenue(
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  ): Promise<RevenueResponse> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append("startDate", startDate.toISOString());
    }
    if (endDate) {
      params.append("endDate", endDate.toISOString());
    }
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const url = `${API_ENDPOINTS.USER.REVENUE}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await apiClient.get<RevenueResponse>(url);

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy doanh thu thất bại");
  },

  async getCurrentWeekCommission(): Promise<OwnerCommission | null> {
    const response = await apiClient.get<OwnerCommission | null>(
      API_ENDPOINTS.USER.CURRENT_WEEK_COMMISSION
    );

    if (response.success) {
      // response.data có thể là null, OwnerCommission, hoặc array
      // Nếu là array thì return null, nếu là null thì return null, nếu là object thì return
      if (Array.isArray(response.data)) {
        return null;
      }
      return response.data ?? null;
    }
    throw new Error(
      response.message || "Lấy commission tuần hiện tại thất bại"
    );
  },

  async uploadInvoice(
    commissionId: string,
    data: UploadInvoiceRequest
  ): Promise<CommissionPayment> {
    const url = API_ENDPOINTS.USER.COMMISSION_PAYMENT.replace(
      ":commissionId",
      commissionId
    );
    const response = await apiClient.post<CommissionPayment>(url, data);

    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Upload hóa đơn thất bại");
  },
};
