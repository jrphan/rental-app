import { CommissionPaymentStatus, RentalStatus } from '@prisma/client';

export interface CommissionSettingsResponse {
  id: string;
  commissionRate: string; // Decimal as string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerCommissionResponse {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalEarning: string;
  commissionRate: string;
  commissionAmount: string;
  rentalCount: number;
  paymentStatus: CommissionPaymentStatus;
  createdAt: string;
  updatedAt: string;
  payment?: CommissionPaymentResponse;
}

export interface CommissionPaymentResponse {
  id: string;
  commissionId: string;
  ownerId: string;
  amount: string;
  invoiceUrl: string | null;
  status: CommissionPaymentStatus;
  adminNotes: string | null;
  paidAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerCommissionListResponse {
  items: OwnerCommissionResponse[];
  total: number;
}

export interface AdminCommissionPaymentListResponse {
  items: Array<
    CommissionPaymentResponse & {
      owner: {
        id: string;
        fullName: string | null;
        phone: string;
      };
      commission: {
        weekStartDate: string;
        weekEndDate: string;
      };
    }
  >;
  total: number;
}

export interface PendingCommissionAlert {
  id: string;
  ownerId: string;
  ownerName: string | null;
  ownerPhone: string;
  weekStartDate: string;
  weekEndDate: string;
  commissionAmount: string;
  totalEarning: string;
  rentalCount: number;
  paymentStatus: CommissionPaymentStatus;
  isOverdue: boolean; // Quá hạn thanh toán
  daysOverdue?: number; // Số ngày quá hạn
}

export interface PendingCommissionAlertsResponse {
  items: PendingCommissionAlert[];
  total: number;
  overdueCount: number; // Số commission quá hạn
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
  totalRevenue: string; // Tổng doanh thu trong khoảng thời gian
  totalEarning: string; // Tổng thu nhập (ownerEarning) trong khoảng thời gian
}
