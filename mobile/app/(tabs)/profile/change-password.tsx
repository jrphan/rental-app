import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useChangePasswordForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PasswordInput } from "@/components/ui/password-input";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  // toggles moved into PasswordInput

  const form = useChangePasswordForm();

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.showSuccess("Đổi mật khẩu thành công!", {
        title: "Thành công",
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Đổi mật khẩu thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate({
      oldPassword: data?.oldPassword ?? "",
      newPassword: data?.newPassword ?? "",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mb-6 pt-4">
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#000"
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          />
          <Text className="text-2xl font-bold text-gray-900">Đổi mật khẩu</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
