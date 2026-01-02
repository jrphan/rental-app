export interface FeeSettingsResponse {
  id: string;
  deliveryFeePerKm: string; // Decimal as string
  insuranceRate50cc: string;
  insuranceRateTayGa: string;
  insuranceRateTayCon: string;
  insuranceRateMoto: string;
  insuranceRateDefault: string;
  insuranceCommissionRatio: string; // Decimal as string (0.20 = 20%)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceStatsResponse {
  totalInsuranceFee: string; // Tổng phí bảo hiểm
  totalInsuranceCommissionAmount: string; // Tổng hoa hồng bảo hiểm nền tảng
  totalInsurancePayableToPartner: string; // Tổng tiền phải trả đối tác bảo hiểm
  totalRentals: number; // Tổng số đơn thuê có bảo hiểm
  periodStart: string; // Ngày bắt đầu kỳ
  periodEnd: string; // Ngày kết thúc kỳ
  byVehicleType: {
    type: string;
    count: number;
    totalFee: string;
    totalCommissionAmount: string;
    totalPayableToPartner: string;
  }[];
}

