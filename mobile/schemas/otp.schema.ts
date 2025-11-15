import { z } from "zod";

/**
 * Schema cho OTP verification
 */
export const otpSchema = z.object({
  otpCode: z
    .string()
    .length(6, "Mã OTP phải có đúng 6 chữ số")
    .regex(/^\d{6}$/, "Mã OTP chỉ được chứa số"),
});

export type OtpInput = z.infer<typeof otpSchema>;

