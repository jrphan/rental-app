import { z } from "zod";

/**
 * Schema cho tạo/cập nhật xe
 */
export const vehicleSchema = z.object({
	type: z.string().min(1, "Loại xe không được để trống").max(50, "Loại xe quá dài"),
	brand: z.string().min(1, "Hãng không được để trống").max(50, "Hãng quá dài"),
	model: z.string().min(1, "Dòng xe không được để trống").max(50, "Dòng xe quá dài"),
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
		.regex(/^[A-Z0-9\s\-]+$/i, "Biển số chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch ngang"),
	engineSize: z
		.string()
		.min(1, "Dung tích xi lanh không được để trống")
		.regex(/^\d+$/, "Dung tích xi lanh phải là số")
		.refine(
			(val) => {
				const size = parseInt(val, 10);
				return size >= 50 && size <= 10000;
			},
			{
				message: "Dung tích xi lanh phải từ 50 đến 10000 cc",
			}
		),
	requiredLicense: z.enum(["A1", "A2", "A3", "A4"], {
		message: "Vui lòng chọn loại bằng lái",
	}),
	fullAddress: z.string().optional(), // full formatted address
	address: z.string().min(1, "Địa chỉ không được để trống"), // street
	ward: z.string().optional(),
	district: z.string().optional(),
	city: z.string().optional(),
	lat: z.string().regex(/^-?\d+\.?\d*$/, "Vĩ độ không hợp lệ"),
	lng: z.string().regex(/^-?\d+\.?\d*$/, "Kinh độ không hợp lệ"),
	pricePerDay: z
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
				return amount >= 0 && amount <= 500000000;
			},
			{
				message: "Tiền cọc phải từ 0 đến 500,000,000 VNĐ",
			}
		),
	description: z.string().optional(),
	cavetFront: z.string().optional(),
	cavetBack: z.string().optional(),
	instantBook: z.boolean().optional(),
	deliveryAvailable: z.boolean().optional(),
	imageUrls: z
		.array(z.string().url("URL hình ảnh không hợp lệ"))
		.min(1, "Cần ít nhất 1 hình ảnh")
		.max(10, "Tối đa 10 hình ảnh"),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
