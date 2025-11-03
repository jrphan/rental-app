import { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChangePasswordForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleShowOldPassword = () => {
    setShowOldPassword(!showOldPassword);
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
                <View className="mb-4">
                  <Input
                    label="Mật khẩu cũ"
                    placeholder="Nhập mật khẩu cũ"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    secureTextEntry={!showOldPassword}
                    editable={!mutation.isPending}
                  />
                  <View className="absolute right-4 top-9">
                    <IconSymbol
                      name={showOldPassword ? "eye" : "eye.slash"}
                      size={22}
                      color="#EA580C"
                      onPress={handleShowOldPassword}
                    />
                  </View>
                </View>
              )}
            />

            <Controller
              control={form.control}
              name="newPassword"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <View className="mb-4">
                  <Input
                    label="Mật khẩu mới"
                    placeholder="Nhập mật khẩu mới"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    secureTextEntry={!showNewPassword}
                    editable={!mutation.isPending}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-9"
                  >
                    <IconSymbol
                      name={showNewPassword ? "eye" : "eye.slash"}
                      size={22}
                      color="#EA580C"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <View className="mb-4">
                  <Input
                    label="Xác nhận mật khẩu mới"
                    placeholder="Nhập lại mật khẩu mới"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    secureTextEntry={!showConfirmPassword}
                    editable={!mutation.isPending}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-9"
                  >
                    <IconSymbol
                      name={showConfirmPassword ? "eye" : "eye.slash"}
                      size={22}
                      color="#EA580C"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          <Button
            onPress={form.handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="mb-24 mt-4"
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
