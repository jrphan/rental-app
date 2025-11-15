import { z } from "zod";

/**
 * Schema cho form tìm kiếm xe
 */
export const searchSchema = z
  .object({
    location: z.string().min(1, "Vui lòng chọn địa điểm"),
    startDate: z.date({
      message: "Vui lòng chọn ngày bắt đầu",
    }),
    endDate: z.date({
      message: "Vui lòng chọn ngày kết thúc",
    }),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  });

export type SearchInput = z.infer<typeof searchSchema>;
