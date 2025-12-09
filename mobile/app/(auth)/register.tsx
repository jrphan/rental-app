import { View, TouchableOpacity, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegisterForm } from "@/forms/auth.forms";
import { authApi } from "@/services/api.auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/hooks/useToast";
import { PasswordInput } from "@/components/ui/password-input";

export default function RegisterScreen() {
  const router = useRouter();
  const toast = useToast();

  const form = useRegisterForm();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Navigate to verify OTP screen instead of logging in
      router.push(
        `/(auth)/verify-otp?userId=${data.userId}&email=${data.email}` as any
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || error?.response?.data?.message || "Đăng ký thất bại";
      toast.showError(errorMessage, { title: "Lỗi đăng ký" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate(data as any);
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Đăng ký để bắt đầu trải nghiệm dịch vụ cho thuê xe máy"
      iconName="moped"
      showBackButton={true}
      onBackPress={() => router.push("/(tabs)/profile")}
      footer={
        <View className="items-center">
          <View className="flex-row items-center">
            <Text className="text-base text-gray-600">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="font-bold text-primary-600">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
    >
      <View className="mb-2">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Đăng ký
        </Text>
      </View>

      <View>
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
            <PasswordInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              autoComplete="password"
            />
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <Input
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              value={value || ""}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          )}
        />

        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="mb-6 mt-2"
          size="lg"
        >
          {mutation.isPending ? <ActivityIndicator color="#FFF" /> : "Đăng ký"}
        </Button>
      </View>
    </AuthLayout>
  );
}
