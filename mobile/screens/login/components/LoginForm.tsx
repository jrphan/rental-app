import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useLoginForm } from "@/hooks/forms/auth.forms";
import { LoginInput } from "@/schemas/auth.schema";
import { useLogin } from "@/hooks/auth/auth.mutation";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import ROUTES from "@/constants/routes";

export default function LoginForm() {
  const router = useRouter();
  const form = useLoginForm();
  const loginMutation = useLogin();

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <>
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
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={error?.message}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoComplete="tel"
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

      <TouchableOpacity
        onPress={() => router.push(ROUTES.FORGOT_PASSWORD)}
        className="mb-4 flex-row items-center justify-end"
      >
        <Text className="text-base text-primary-600 font-medium">
          Quên mật khẩu?
        </Text>
      </TouchableOpacity>

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={loginMutation.isPending}
        className="mb-6 mt-2"
        size="md"
      >
        {loginMutation.isPending ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          "Đăng nhập"
        )}
      </Button>
    </>
  );
}
