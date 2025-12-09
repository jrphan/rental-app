import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, OtpInput } from "@/schemas/otp.schema";

/**
 * Hook cho form xác thực OTP
 */
export function useOtpForm() {
  const form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otpCode: "",
    },
    mode: "onChange",
  });

  return form;
}
