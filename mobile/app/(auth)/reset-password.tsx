import { useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPasswordForm } from "@/hooks/forms/auth.forms";
import { authApi } from "@/services/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/hooks/useToast";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || "";
  const login = useAuthStore((state) => state.login);
  const toast = useToast();

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
      toast.showSuccess(
        "Mật khẩu của bạn đã được đặt lại thành công. Bạn đã được đăng nhập tự động.",
        {
          title: "Đặt lại mật khẩu thành công",
          onPress: () => router.replace("/(tabs)"),
          duration: 3000,
        }
      );
      // Navigate after showing toast
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Đặt lại mật khẩu thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate({
      email,
      otpCode: data?.otpCode ?? "",
      newPassword: data?.newPassword ?? "",
    });
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã OTP và mật khẩu mới"
      email={email}
      iconName="moped"
      showBackButton={true}
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
          <PasswordInput
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            autoComplete="password-new"
          />
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error },
        }) => (
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            placeholder="Nhập lại mật khẩu mới"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            autoComplete="password-new"
          />
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mb-4 mt-2"
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
