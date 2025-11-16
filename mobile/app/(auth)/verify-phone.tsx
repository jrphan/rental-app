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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/lib/toast";
import { Controller } from "react-hook-form";
import { useOtpForm } from "@/forms/otp.forms";

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const toast = useToast();
  const queryClient = useQueryClient();
  const form = useOtpForm();

  const phone = params.phone || user?.phone || "";

  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const hiddenInputRef = useRef<TextInput>(null);

  const otpValue = form.watch("otpCode");
  const otpCode = Array.from({ length: 6 }, (_, i) => otpValue[i] || "");

  // Auto send OTP when screen loads
  useEffect(() => {
    if (phone) {
      sendOTPMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

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

  const sendOTPMutation = useMutation({
    mutationFn: () => authApi.sendPhoneOTP(phone),
    onSuccess: () => {
      toast.showSuccess("Mã OTP đã được gửi đến số điện thoại của bạn", {
        title: "Thành công",
      });
      setCanResend(false);
      form.setValue("otpCode", "");
      setResendTimer(60);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || error?.response?.data?.message || "Gửi OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => authApi.verifyPhoneOTP(phone, otp),
    onSuccess: async (data) => {
      // Update user state
      updateUser({ isPhoneVerified: data.isPhoneVerified });

      // Refresh user data from server
      try {
        const updatedUser = await authApi.getMe();
        updateUser(updatedUser);
      } catch {
        // Ignore error, we already updated locally
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries();

      toast.showSuccess("Xác minh số điện thoại thành công!", {
        title: "Thành công",
        onPress: () => router.back(),
        duration: 2000,
      });

      // Navigate back after showing toast
      setTimeout(() => {
        router.back();
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
    mutationFn: () => authApi.resendPhoneOTP(phone),
    onSuccess: () => {
      toast.showSuccess("Đã gửi lại mã OTP đến số điện thoại của bạn", {
        title: "Thành công",
      });
      setCanResend(false);
      form.setValue("otpCode", "");
      setResendTimer(60);
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

  if (!phone) {
    return (
      <AuthLayout
        iconName="phone"
        title="Lỗi"
        subtitle="Không tìm thấy số điện thoại"
        showBackButton={true}
      >
        <View className="items-center">
          <Text className="mb-4 text-center text-gray-600">
            Vui lòng thêm số điện thoại trong phần cài đặt tài khoản
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/edit-profile")}
            className="rounded-2xl bg-primary-600 px-6 py-3"
          >
            <Text className="font-bold text-white">Đi đến cài đặt</Text>
          </TouchableOpacity>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Xác minh Số điện thoại"
      subtitle={"Chúng tôi đã gửi mã OTP đến số:"}
      email={phone}
      iconName="phone"
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
          Vui lòng nhập mã 6 số để xác minh số điện thoại
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => hiddenInputRef.current?.focus()}
          className="relative mb-3"
        >
          <View className="flex-row justify-between" pointerEvents="box-none">
            {otpCode.map((digit, index) => (
              <View
                key={index}
                pointerEvents="none"
                className={`h-14 w-12 items-center justify-center rounded-2xl border-2 bg-white ${
                  index === activeIndex
                    ? "border-primary-500 border-4"
                    : digit
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              >
                <Text className="text-2xl font-bold text-gray-900">
                  {digit}
                </Text>
              </View>
            ))}
          </View>

          {/* TextInput ẩn overlay để nhập OTP từ keyboard */}
          <Controller
            control={form.control}
            name="otpCode"
            render={({ field: { value, onChange } }) => (
              <TextInput
                ref={hiddenInputRef}
                value={value || ""}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "").slice(0, 6);
                  handleOtpChange(digits);
                  onChange(digits);
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
                  fontSize: 1,
                  width: "100%",
                  height: 56,
                }}
                caretHidden
                contextMenuHidden
              />
            )}
          />
        </TouchableOpacity>
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
                  Xác minh
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      />
    </AuthLayout>
  );
}
