import { ActivityIndicator } from "react-native";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useRegisterForm } from "@/hooks/forms/auth.forms";
import { RegisterInput } from "@/schemas/auth.schema";
import { useRegister } from "@/hooks/auth/auth.mutation";

export default function RegisterForm() {
  const form = useRegisterForm();
  const registerMutation = useRegister();

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

  return (
    <>
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
        disabled={registerMutation.isPending}
        className="mb-6 mt-2"
        size="lg"
      >
        {registerMutation.isPending ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          "Đăng ký"
        )}
      </Button>
    </>
  );
}
