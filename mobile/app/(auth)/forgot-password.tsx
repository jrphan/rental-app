import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForgotPasswordForm } from "@/forms/auth.forms";
import { authApi } from "@/services/api.auth";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { useToast } from "@/hooks/useToast";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const form = useForgotPasswordForm();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      const email = form.getValues("email");
      toast.showSuccess(
        "Nếu email tồn tại, mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email và nhập mã OTP để đặt lại mật khẩu.",
        {
          title: "Đã gửi OTP",
          onPress: () => {
            if (email) {
              router.push({
                pathname: "/(auth)/reset-password",
                params: { email },
              });
            }
          },
          duration: 3000,
        }
      );
      // Navigate after showing toast
      setTimeout(() => {
        if (email) {
          router.push({
            pathname: "/(auth)/reset-password",
            params: { email },
          });
        }
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gửi OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    const email = data?.email;
    if (email) {
      mutation.mutate(email);
    }
  };

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn để nhận mã OTP đặt lại mật khẩu"
      iconName="moped"
      showBackButton={true}
    >
      <View className="mb-4">
        <Text className="text-xl font-bold text-gray-900 text-center">
          Nhập Email
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
            editable={!mutation.isPending}
          />
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mb-4 mt-2"
        size="lg"
      >
        {mutation.isPending ? <ActivityIndicator color="#FFF" /> : "Gửi mã OTP"}
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
