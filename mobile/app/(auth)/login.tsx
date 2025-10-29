import { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const form = useLoginForm();

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      console.log("Full error object:", error);

      // The axios interceptor already formats the error to ErrorResponse
      // So error will have: { success, message, statusCode, userId, email, requiresVerification }
      const errorMessage = error?.message || "Đăng nhập thất bại";

      // Check if this is an unverified account error
      // The error object directly contains requiresVerification, userId, email
      if (error?.statusCode === 400 && error?.requiresVerification) {
        const userId = error?.userId;
        const email = error?.email;

        console.log("Unverified account, navigating to verify OTP:", {
          userId,
          email,
        });

        // Navigate to verify OTP screen with user information
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { userId, email },
        });
      } else {
        console.error("Login error:", errorMessage);
        Alert.alert("Lỗi đăng nhập", errorMessage);
      }
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate(data as any);
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để tiếp tục trải nghiệm dịch vụ cho thuê xe máy"
      iconName="moped"
      footer={
        <View className="items-center">
          <View className="flex-row items-center">
            <Text className="text-base text-gray-600">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text className="font-bold text-primary-600">Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      <View className="mb-2">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Đăng nhập
        </Text>
      </View>

      <Controller
        control={form.control}
        name="email"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Email"
            placeholder="Nhập email của bạn"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View>
            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9"
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
              }
            >
              <IconSymbol
                name={showPassword ? "eye" : "eye.slash"}
                size={22}
                color="#EA580C"
              />
            </TouchableOpacity>
          </View>
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mb-6 mt-2"
        size="lg"
      >
        {mutation.isPending ? <ActivityIndicator color="#FFF" /> : "Đăng nhập"}
      </Button>
    </AuthLayout>
  );
}
