import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginForm } from "@/forms/auth.forms";
import { authApi } from "@/lib/api.auth";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@tanstack/react-query";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const form = useLoginForm();

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Đăng nhập thất bại";
      console.error("Login error:", errorMessage);
      // You can show an alert or toast here
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    mutation.mutate(data as any);
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      contentContainerClassName="px-6 py-8"
    >
      <View className="mb-8">
        <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Đăng nhập
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-400">
          Chào mừng bạn quay trở lại!
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
                className="absolute right-4 top-12"
              >
                <Text className="text-sm text-blue-600">
                  {showPassword ? "Ẩn" : "Hiện"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="mb-4 text-right text-sm text-blue-600">
            Quên mật khẩu?
          </Text>
        </TouchableOpacity> */}

        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={mutation.isPending}
          className="mb-4"
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Đăng nhập
            </Text>
          )}
        </Button>

        <View className="flex-row items-center justify-center">
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Chưa có tài khoản?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text className="font-semibold text-blue-600">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
