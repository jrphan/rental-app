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
			brand: defaultValues?.brand || "",
			model: defaultValues?.model || "",
			year: defaultValues?.year || "2020",
			color: defaultValues?.color || "",
			licensePlate: defaultValues?.licensePlate || "",
			fuelType: defaultValues?.fuelType || "PETROL",
			transmission: defaultValues?.transmission || "MANUAL",
			dailyRate: defaultValues?.dailyRate || "200000",
			depositAmount: defaultValues?.depositAmount || "1000000",
			imageUrls: defaultValues?.imageUrls || [],
			registrationDocs: defaultValues?.registrationDocs || "", // <-- MỚI: URLs giấy tờ (sẽ được lưu vào VehicleImage.kind = DOCUMENT)
			vehicleTypeId: defaultValues?.vehicleTypeId || "", // <-- MỚI: liên kết tới VehicleType
			location: defaultValues?.location || "",
			cityId: defaultValues?.cityId || "",
		},
		mode: "onChange",
	});

	return form;
}
