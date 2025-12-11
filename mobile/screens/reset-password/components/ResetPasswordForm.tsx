import { ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useResetPasswordForm } from "@/hooks/forms/auth.forms";
import { useResetPassword } from "@/hooks/auth/auth.mutation";
import { ResetPasswordInput } from "@/schemas/auth.schema";

interface ResetPasswordFormProps {
  phone: string;
}

export default function ResetPasswordForm({ phone }: ResetPasswordFormProps) {
  const router = useRouter();
  const form = useResetPasswordForm();
  const resetPasswordMutation = useResetPassword();

  useEffect(() => {
    if (phone) {
      form.setValue("phone", phone);
    }
  }, [phone, form]);

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate({
      phone,
      otpCode: data?.otpCode ?? "",
      newPassword: data?.newPassword ?? "",
      confirmPassword: data?.confirmPassword ?? "",
    });
  };

  return (
    <>
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
            editable={!resetPasswordMutation.isPending}
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
        disabled={resetPasswordMutation.isPending}
        className="mb-4 mt-2"
        size="lg"
      >
        {resetPasswordMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          "Đặt lại mật khẩu"
        )}
      </Button>

      <Button
        onPress={() => router.back()}
        disabled={resetPasswordMutation.isPending}
        variant="outline"
        size="lg"
      >
        Quay lại
      </Button>
    </>
  );
}
