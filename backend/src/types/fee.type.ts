export interface FeeSettingsResponse {
  id: string;
  deliveryFeePerKm: string; // Decimal as string
  insuranceRate50cc: string;
  insuranceRateTayGa: string;
  insuranceRateTayCon: string;
  insuranceRateMoto: string;
  insuranceRateDefault: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceStatsResponse {
  totalInsuranceFee: string; // Tổng phí bảo hiểm
  totalRentals: number; // Tổng số đơn thuê có bảo hiểm
  periodStart: string; // Ngày bắt đầu kỳ
  periodEnd: string; // Ngày kết thúc kỳ
  byVehicleType: {
    type: string;
    count: number;
    totalFee: string;
  }[];
}

