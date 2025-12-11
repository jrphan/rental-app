import { View, ActivityIndicator, Text } from "react-native";
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPasswordForm } from "@/hooks/forms/auth.forms";
import { authApi } from "@/services/api.auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/hooks/useToast";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || "";
  const toast = useToast();

  const form = useResetPasswordForm();

  useEffect(() => {
    if (phone) {
      form.setValue("phone", phone);
    }
  }, [phone, form]);

  const mutation = useMutation({
    mutationFn: ({
      phone,
      otpCode,
      newPassword,
    }: {
      phone: string;
      otpCode: string;
      newPassword: string;
    }) => authApi.resetPassword(phone, otpCode, newPassword),
    onSuccess: () => {
      toast.showSuccess("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.", {
        title: "Thành công",
        onPress: () => router.replace("/(auth)/login"),
        duration: 2000,
      });
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Đặt lại mật khẩu thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate({
      phone,
      otpCode: data?.otpCode ?? "",
      newPassword: data?.newPassword ?? "",
    });
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã OTP và mật khẩu mới"
      phone={phone}
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
