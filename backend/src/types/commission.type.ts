import { CommissionPaymentStatus } from '@prisma/client';

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
