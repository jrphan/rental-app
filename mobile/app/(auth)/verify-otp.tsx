import { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/lib/toast";
import { Controller } from "react-hook-form";
import { useOtpForm } from "@/forms/otp.forms";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; email: string }>();
  const login = useAuthStore((state) => state.login);
  const toast = useToast();
  const form = useOtpForm();

  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const hiddenInputRef = useRef<TextInput>(null);

  const otpValue = form.watch("otpCode");
  const otpCode = Array.from({ length: 6 }, (_, i) => otpValue[i] || "");

  const handleOtpChange = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    form.setValue("otpCode", digits, { shouldValidate: true });
  };

  // Tìm index của ô hiện tại (ô trống đầu tiên hoặc ô cuối cùng nếu đã đầy)
  const currentIndex = otpCode.findIndex((digit) => !digit);
  const activeIndex = currentIndex === -1 ? 5 : currentIndex;

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

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => authApi.verifyOTP(params.userId!, otp),
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.showSuccess("Chào mừng bạn đến với Rental App!", {
        title: "Xác thực thành công",
        onPress: () => router.replace("/(tabs)"),
        duration: 2000,
      });
      // Navigate after showing toast
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Mã OTP không hợp lệ";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOTP(params.userId!),
    onSuccess: () => {
      toast.showSuccess("Đã gửi lại mã OTP đến email của bạn", {
        title: "Thành công",
      });
      setCanResend(false);
      form.setValue("otpCode", "");
      setResendTimer(60); // Bắt đầu đếm ngược 60 giây
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Gửi lại OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const handleVerify = (data: typeof form.formState.defaultValues) => {
    if (data?.otpCode) {
      verifyMutation.mutate(data.otpCode);
    }
  };

  return (
    <AuthLayout
      title="Xác thực Email"
      subtitle={"Chúng tôi đã gửi mã OTP đến địa chỉ:"}
      email={params.email}
      iconName="moped"
      showBackButton={true}
      footer={
        <View className="items-center">
          <Text className="mb-2 text-sm text-gray-600">
            Không nhận được mã?
          </Text>
          <TouchableOpacity
            onPress={() => resendMutation.mutate()}
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
      }
    >
      <View className="mb-2">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Nhập mã xác thực
        </Text>
      </View>

      {/* OTP Input */}
      <View className="mb-6">
        <Text className="mb-4 text-center text-sm text-gray-600">
          Vui lòng nhập mã 6 số để xác thực tài khoản
        </Text>

        <View className="relative flex-row justify-between mb-3">
          {otpCode.map((digit, index) => (
            <View
              key={index}
              className={`h-14 w-12 items-center justify-center rounded-2xl border-2 bg-white ${
                index === activeIndex
                  ? "border-primary-500 border-4"
                  : digit
                  ? "border-green-500"
                  : "border-gray-300"
              }`}
            >
              <Text className="text-2xl font-bold text-gray-900">{digit}</Text>
            </View>
          ))}

          {/* TextInput ẩn overlay để nhập OTP từ keyboard */}
          <Controller
            control={form.control}
            name="otpCode"
            render={({ field: { value, onChange } }) => (
              <TextInput
                ref={hiddenInputRef}
                value={value}
                onChangeText={(text) => {
                  handleOtpChange(text);
                  onChange(text.replace(/\D/g, "").slice(0, 6));
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                autoFocus
                maxLength={6}
                returnKeyType="done"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0,
                  zIndex: 1,
                }}
                onTouchStart={(e) => {
                  // Ensure keyboard stays open
                  hiddenInputRef.current?.focus();
                }}
              />
            )}
          />
        </View>
      </View>

      {/* Verify Button */}
      <Controller
        control={form.control}
        name="otpCode"
        render={({ fieldState: { error } }) => (
          <>
            {error && (
              <Text className="text-red-500 text-xs mb-3 text-center">
                {error.message}
              </Text>
            )}
            <TouchableOpacity
              onPress={form.handleSubmit(handleVerify)}
              disabled={verifyMutation.isPending || !form.formState.isValid}
              className={`mb-6 rounded-2xl py-4 ${
                verifyMutation.isPending || !form.formState.isValid
                  ? "bg-gray-300"
                  : "bg-primary-600"
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
          </>
        )}
      />
    </AuthLayout>
  );
}
