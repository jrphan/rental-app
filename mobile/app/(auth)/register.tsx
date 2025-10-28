import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRegisterForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";

export default function RegisterScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const form = useRegisterForm();

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message || error?.response?.data?.message || "Đăng ký thất bại";
      console.error("Register error:", errorMessage);
      // You can show an alert or toast here
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate(data as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Decorative Background */}
      <View className="absolute top-0 left-0 right-0 h-80 bg-primary-500 opacity-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-lg">
            <IconSymbol name="house.fill" size={40} color="white" />
          </View>
          <Text className="mb-2 text-3xl font-extrabold text-gray-900">
            Tạo tài khoản mới
          </Text>
          <Text className="text-center text-base text-gray-600">
            Đăng ký để bắt đầu trải nghiệm dịch vụ cho thuê xe máy
          </Text>
        </View>

        {/* Form Card */}
        <View className="rounded-3xl bg-white p-6 shadow-xl">
          <View className="mb-2">
            <Text className="text-2xl font-bold text-gray-900">Đăng ký</Text>
            <Text className="mt-1 text-sm text-gray-500">
              Điền thông tin đăng ký
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
                <View>
                  <Input
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-9"
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                    }
                  >
                    <IconSymbol
                      name={showPassword ? "eye" : "eye.slash"}
                      size={22}
                      color="#EA580C"
                    />
                  </TouchableOpacity>
                </View>
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
                  label="Số điện thoại (tùy chọn)"
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
              {mutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                "Đăng ký"
              )}
            </Button>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-6 items-center">
          <View className="flex-row items-center">
            <Text className="text-base text-gray-600">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text className="font-bold text-primary-600">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
