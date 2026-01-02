import { useQuery } from "@tanstack/react-query";
import { apiFee } from "@/services/api.fee";
import { DELIVERY_FEE_PER_KM } from "@/constants/deliveryFee";

/**
 * Hook để lấy fee settings từ API
 * Fallback về constants nếu API fail
 */
export function useFeeSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["feeSettings"],
    queryFn: () => apiFee.getFeeSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fallback values
  const deliveryFeePerKm = data
    ? parseFloat(data.deliveryFeePerKm)
    : DELIVERY_FEE_PER_KM;

  const getInsuranceRate = (type?: string): number => {
    if (!data) {
      // Fallback to hardcoded logic
      const t = (type || "").toLowerCase();
      if (t.includes("50cc") || t.includes("xe số")) return 20000;
      if (t.includes("tay ga") || t.includes("xe điện")) return 30000;
      if (t.includes("mô tô") || t.includes("tay côn")) return 50000;
      return 30000;
    }

    // Use API values
    const t = (type || "").toLowerCase();
    if (t.includes("50cc") || t.includes("xe số")) {
      return parseFloat(data.insuranceRate50cc);
    }
    if (t.includes("tay ga") || t.includes("xe điện")) {
      return parseFloat(data.insuranceRateTayGa);
    }
    if (t.includes("tay côn")) {
      return parseFloat(data.insuranceRateTayCon);
    }
    if (t.includes("mô tô")) {
      return parseFloat(data.insuranceRateMoto);
    }
    return parseFloat(data.insuranceRateDefault);
  };

  return {
    deliveryFeePerKm,
    getInsuranceRate,
    isLoading,
    error,
    settings: data,
  };
}

