import { useQuery } from "@tanstack/react-query";
import { apiVehicle } from "@/services/api.vehicle";
import type { Vehicle } from "@/screens/vehicles/types";

/**
 * Hook tính toán các thống kê của xe (hoàn thành từ API)
 * Nếu vehicle đã có completedTrips từ API, dùng ngay
 * Nếu không, trả về 0 (data từ detail endpoint sẽ có)
 */
export function useVehicleStats(vehicle: Vehicle) {
	const completedTrips = (vehicle as any).completedTrips ?? 0;

	return {
		completedTrips,
	};
}
