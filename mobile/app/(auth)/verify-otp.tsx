import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter, useLocalSearchParams } from "expo-router";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; email: string }>();
  const login = useAuthStore((state) => state.login);

  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [canResend, setCanResend] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOTP(params.userId!, otpCode.join("")),
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      Alert.alert("Xác thực thành công", "Chào mừng bạn đến với Rental App!", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Mã OTP không hợp lệ";
      Alert.alert("Lỗi", errorMessage);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOTP(params.userId!),
    onSuccess: () => {
      Alert.alert("Thành công", "Đã gửi lại mã OTP đến email của bạn");
      setCanResend(false);
      setOtpCode(["", "", "", "", "", ""]);

      // Đếm ngược để cho phép gửi lại sau 60 giây
      setTimeout(() => setCanResend(true), 60000);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Gửi lại OTP thất bại";
      Alert.alert("Lỗi", errorMessage);
    },
  });

  const handleVerify = () => {
    if (otpCode.some((digit) => !digit)) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }
    verifyMutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Decorative Background */}
      <View className="absolute top-0 left-0 right-0 h-80 bg-primary-500 opacity-10" />

      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-lg">
            <IconSymbol name="checkmark.circle.fill" size={40} color="white" />
          </View>
          <Text className="mb-2 text-3xl font-extrabold text-gray-900">
            Xác thực Email
          </Text>
          <Text className="text-center text-base text-gray-600">
            Chúng tôi đã gửi mã OTP đến địa chỉ
          </Text>
          <Text className="text-base font-bold text-primary-600">
            {params.email}
          </Text>
        </View>

        {/* OTP Input */}
        <View className="mb-6">
          <Text className="mb-4 text-center text-sm text-gray-600">
            Vui lòng nhập mã 6 số để xác thực tài khoản
          </Text>

          <View className="flex-row justify-between">
            {otpCode.map((digit, index) => (
              <View
                key={index}
                className="h-14 w-12 items-center justify-center rounded-2xl border-2 border-gray-300 bg-white"
              >
                <Text className="text-2xl font-bold text-gray-900">
                  {digit}
                </Text>
              </View>
            ))}
          </View>

          {/* Text Input ẩn để nhập OTP */}
          <View className="absolute opacity-0">
            {/* TODO: Thêm TextInput ẩn để nhập OTP từ keyboard */}
          </View>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={verifyMutation.isPending || otpCode.some((digit) => !digit)}
          className={`mb-4 rounded-2xl py-4 ${
            verifyMutation.isPending || otpCode.some((digit) => !digit)
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

        {/* Resend OTP */}
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
              {resendMutation.isPending ? "Đang gửi..." : "Gửi lại mã OTP"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Simple 6-digit input for now */}
        <View className="mt-4">
          <Text className="mb-2 text-sm text-gray-600">
            Hoặc nhập mã dưới đây:
          </Text>
          <TouchableOpacity
            onPress={() => {
              // Tạm thời sử dụng Alert để nhập OTP
              Alert.alert(
                "Nhập mã OTP",
                "Vui lòng nhập mã 6 số vào ô nhập văn bản",
                [
                  {
                    text: "OK",
                  },
                ]
              );
            }}
            className="rounded-2xl border-2 border-gray-300 bg-white p-4"
          >
            <Text className="text-center text-6xl font-bold text-gray-900">
              {otpCode.join("") || "------"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
