import { View, ActivityIndicator, Text } from "react-native";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { useChangePasswordForm } from "@/hooks/forms/auth.forms";
import { useChangePassword } from "@/hooks/auth/auth.mutation";
import { ChangePasswordInput } from "@/schemas/auth.schema";

export default function ChangePasswordForm() {
  const form = useChangePasswordForm();
  const mutation = useChangePassword();

  const onSubmit = (data: ChangePasswordInput) => {
    mutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <>
      <View className="mb-4">
        <Text className="text-base text-gray-600 mb-6">
          Vui lòng nhập mật khẩu cũ và mật khẩu mới để thay đổi mật khẩu của
          bạn.
        </Text>

        <Controller
          control={form.control}
          name="oldPassword"
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <PasswordInput
              label="Mật khẩu cũ"
              placeholder="Nhập mật khẩu cũ"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
              editable={!mutation.isPending}
              toggleClassName="absolute right-4 top-10"
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
              editable={!mutation.isPending}
              toggleClassName="absolute right-4 top-10"
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
              editable={!mutation.isPending}
              toggleClassName="absolute right-4 top-10"
            />
          )}
        />
      </View>

      <Button
        onPress={form.handleSubmit(onSubmit)}
        disabled={mutation.isPending}
        className="mb-24"
        size="lg"
      >
        {mutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          "Đổi mật khẩu"
        )}
      </Button>
    </>
  );
}
