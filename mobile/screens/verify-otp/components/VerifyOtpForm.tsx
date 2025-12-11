import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Controller } from "react-hook-form";
import { useOtpForm } from "@/hooks/forms/otp.forms";
import { useVerifyOTP, useResendOTP } from "@/hooks/auth/auth.mutation";
import { OtpInput } from "@/schemas/otp.schema";
import { useEffect, useState } from "react";

interface VerifyOtpFormProps {
  userId: string;
}

export default function VerifyOtpForm({ userId }: VerifyOtpFormProps) {
  const form = useOtpForm();
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const verifyMutation = useVerifyOTP();
  const resendMutation = useResendOTP();

  const handleVerify = (data: OtpInput) => {
    if (data?.otpCode && userId) {
      verifyMutation.mutate({ userId, otpCode: data.otpCode });
    }
  };

  const handleResend = () => {
    if (userId) {
      resendMutation.mutate(
        { userId },
        {
          onSuccess: () => {
            setCanResend(false);
            form.setValue("otpCode", "", { shouldValidate: true });
            setResendTimer(60); // Bắt đầu đếm ngược 60 giây
          },
        }
      );
    }
  };

  // Đếm ngược timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendTimer === 0 && !canResend) {
      setCanResend(true);
    }
  }, [resendTimer, canResend]);

  return (
    <>
      <View className="mb-6">
        <Text className="mb-4 text-center text-sm text-gray-600">
          Vui lòng nhập mã 6 số để xác thực tài khoản
        </Text>

        <Controller
          control={form.control}
          name="otpCode"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              value={value || ""}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, "").slice(0, 6);
                onChange(digits);
              }}
              onBlur={onBlur}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              importantForAutofill="yes"
              autoFocus
              maxLength={6}
              returnKeyType="done"
              placeholder="••••••"
              placeholderTextColor="#9CA3AF"
              className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[14px] text-gray-900"
            />
          )}
        />
      </View>

      {form.formState.errors.otpCode && (
        <Text className="text-red-500 text-xs mb-3 text-center">
          {form.formState.errors.otpCode.message}
        </Text>
      )}

      <TouchableOpacity
        onPress={form.handleSubmit(handleVerify)}
        disabled={verifyMutation.isPending || !form.formState.isValid}
        className={`mb-6 rounded-2xl py-4 bg-primary-600 ${
          verifyMutation.isPending || !form.formState.isValid
            ? "opacity-50"
            : ""
        }`}
      >
        {verifyMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text className="text-center text-lg font-bold text-white">
            Xác thực
          </Text>
        )}
      </TouchableOpacity>

      <View className="items-center">
        <Text className="mb-2 text-sm text-gray-600">Không nhận được mã?</Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendMutation.isPending || !canResend}
        >
          <Text
            className={`font-bold ${
              resendMutation.isPending || !canResend
                ? "text-gray-400"
                : "text-primary-600"
            }`}
          >
            {resendMutation.isPending
              ? "Đang gửi..."
              : canResend
              ? "Gửi lại mã OTP"
              : `Gửi lại mã OTP (${resendTimer}s)`}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
