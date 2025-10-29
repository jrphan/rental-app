import { useState } from "react";
import { View, ActivityIndicator, Text, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPasswordForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || "";
  const login = useAuthStore((state) => state.login);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useResetPasswordForm();

  const mutation = useMutation({
    mutationFn: ({
      email,
      otpCode,
      newPassword,
    }: {
      email: string;
      otpCode: string;
      newPassword: string;
    }) => authApi.resetPassword(email, otpCode, newPassword),
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      Alert.alert(
        "Đặt lại mật khẩu thành công",
        "Mật khẩu của bạn đã được đặt lại thành công. Bạn đã được đăng nhập tự động.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Đặt lại mật khẩu thất bại";
      console.error("Reset password error:", errorMessage);
      Alert.alert("Lỗi", errorMessage);
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate({
      email,
      otpCode: data.otpCode,
      newPassword: data.newPassword,
    });
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã OTP và mật khẩu mới"
      email={email}
      iconName="lock"
    >
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900 text-center">
          Nhập mã OTP
        </Text>
      </View>

      <Controller
        control={form.control}
        name="otpCode"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <Input
            label="Mã OTP"
            placeholder="Nhập mã OTP 6 chữ số"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            keyboardType="number-pad"
            maxLength={6}
            editable={!mutation.isPending}
          />
        )}
      />

      <Controller
        control={form.control}
        name="newPassword"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View>
            <Input
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              secureTextEntry={!showNewPassword}
              autoComplete="password-new"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-8"
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? "Ẩn" : "Hiện"}
            </Button>
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <View>
            <Input
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-8"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Ẩn" : "Hiện"}
            </Button>
          </View>
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mb-6 mt-6"
        size="lg"
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          "Đặt lại mật khẩu"
        )}
      </Button>

      <Button
        onPress={() => router.back()}
        disabled={mutation.isPending}
        variant="outline"
        size="lg"
      >
        Quay lại
      </Button>
    </AuthLayout>
  );
}
