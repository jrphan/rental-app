import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema, VehicleInput } from "@/schemas/vehicle.schema";

/**
 * Hook cho form tạo/cập nhật xe
 */
export function useVehicleForm(defaultValues?: Partial<VehicleInput>) {
	const form = useForm<VehicleInput>({
		resolver: zodResolver(vehicleSchema),
		defaultValues: {
			type: defaultValues?.type || "",
			brand: defaultValues?.brand || "",
			model: defaultValues?.model || "",
			year: defaultValues?.year || "",
			color: defaultValues?.color || "",
			licensePlate: defaultValues?.licensePlate || "",
			engineSize: defaultValues?.engineSize || "110",
			requiredLicense: defaultValues?.requiredLicense || "A1",
			fullAddress: defaultValues?.fullAddress || "",
			address: defaultValues?.address || "", // street
			ward: defaultValues?.ward || "",
			district: defaultValues?.district || "",
			city: defaultValues?.city || "",
			lat: defaultValues?.lat || "",
			lng: defaultValues?.lng || "",
			pricePerDay: defaultValues?.pricePerDay || "",
			depositAmount: defaultValues?.depositAmount || "",
			description: defaultValues?.description || "",
			cavetFront: defaultValues?.cavetFront || "",
			cavetBack: defaultValues?.cavetBack || "",
			instantBook: defaultValues?.instantBook || false,
			deliveryAvailable: defaultValues?.deliveryAvailable || false,
			imageUrls: defaultValues?.imageUrls || [],
			// Default: baseFee = 0 (no base), feePerKm = 10000 (system default)
			deliveryBaseFee: defaultValues?.deliveryBaseFee ?? "0",
			deliveryFeePerKm: defaultValues?.deliveryFeePerKm ?? "10000",
			deliveryRadiusKm: defaultValues?.deliveryRadiusKm || "",
		},
		mode: "onChange",
	});

	return form;
}
