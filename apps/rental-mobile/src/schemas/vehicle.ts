import { z } from "zod";

export const vehicleSearchSchema = z.object({
  location: z.string().min(1, "Vui lòng chọn địa điểm"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  vehicleType: z.string().optional(),
});

export const vehicleBookingSchema = z.object({
  vehicleId: z.string().min(1, "Vui lòng chọn xe"),
  startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  pickupLocation: z.string().min(1, "Vui lòng chọn địa điểm nhận xe"),
  returnLocation: z.string().min(1, "Vui lòng chọn địa điểm trả xe"),
  notes: z.string().optional(),
});

export type VehicleSearchFormData = z.infer<typeof vehicleSearchSchema>;
export type VehicleBookingFormData = z.infer<typeof vehicleBookingSchema>;
