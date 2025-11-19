import { z } from "zod";

/**
 * Schema cho tạo/cập nhật xe
 */
export const vehicleSchema = z.object({
  brand: z.string().min(1, "Hãng không được để trống").max(50, "Hãng quá dài"),
  location: z.string().min(1, "Địa chỉ không được để trống"),
  cityId: z.string().min(1, "Thành phố không được để trống"),
  model: z
    .string()
    .min(1, "Dòng xe không được để trống")
    .max(50, "Dòng xe quá dài"),
  year: z
    .string()
    .min(1, "Năm không được để trống")
    .regex(/^\d+$/, "Năm phải là số")
    .refine(
      (val) => {
        const year = parseInt(val, 10);
        const currentYear = new Date().getFullYear();
        return year >= 1900 && year <= currentYear + 1;
      },
      {
        message: `Năm phải từ 1900 đến ${new Date().getFullYear() + 1}`,
      }
    ),
  color: z.string().min(1, "Màu không được để trống").max(30, "Màu quá dài"),
  licensePlate: z
    .string()
    .min(1, "Biển số không được để trống")
    .max(20, "Biển số quá dài")
    .regex(
      /^[A-Z0-9\s\-]+$/i,
      "Biển số chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang"
    ),
  fuelType: z.enum(["PETROL", "ELECTRIC", "HYBRID"], {
    message: "Vui lòng chọn loại nhiên liệu",
  }),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "SEMI_AUTOMATIC"], {
    message: "Vui lòng chọn loại hộp số",
  }),
  dailyRate: z
    .string()
    .min(1, "Giá ngày không được để trống")
    .regex(/^\d+$/, "Giá ngày phải là số")
    .refine(
      (val) => {
        const amount = parseInt(val, 10);
        return amount > 0 && amount <= 100000000;
      },
      {
        message: "Giá ngày phải từ 1 đến 100,000,000 VNĐ",
      }
    ),
  depositAmount: z
    .string()
    .min(1, "Tiền cọc không được để trống")
    .regex(/^\d+$/, "Tiền cọc phải là số")
    .refine(
      (val) => {
        const amount = parseInt(val, 10);
        return amount > 0 && amount <= 500000000;
      },
      {
        message: "Tiền cọc phải từ 1 đến 500,000,000 VNĐ",
      }
    ),
  imageUrls: z
    .array(z.string().url("URL hình ảnh không hợp lệ"))
    .min(2, "Cần ít nhất 2 hình ảnh theo yêu cầu")
    .max(10, "Tối đa 10 hình ảnh"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
