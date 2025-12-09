import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPasswordForm } from "@/hooks/forms/auth.forms";
import { ForgotPasswordInput } from "@/schemas/auth.schema";
import { useForgotPassword } from "@/hooks/auth/auth.mutation";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const form = useForgotPasswordForm();

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data);
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
            editable={!forgotPasswordMutation.isPending}
          />
        )}
      />

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={forgotPasswordMutation.isPending}
        className="mb-4 mt-2"
        size="lg"
      >
        {forgotPasswordMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          "Gửi mã OTP"
        )}
      </Button>

      <Button
        onPress={() => router.back()}
        disabled={forgotPasswordMutation.isPending}
        variant="outline"
        size="lg"
      >
        Quay lại
      </Button>
    </>
  );
}
