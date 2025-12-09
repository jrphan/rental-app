import { useMutation } from "@tanstack/react-query";
import { authApi, AuthResponse, RegisterResponse } from "@/services/api.auth";
import { ApiError } from "@/types/api.types";
import { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";

export function useRegister() {
  const toast = useToast();
  const router = useRouter();

  return useMutation<RegisterResponse, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.userId && data.email) {
        router.push(ROUTES.VERIFY_OTP([data.userId, data.email]));
      }
    },
    onError: (error: ApiError) => {
      const errorMessage = error.message || "Đăng ký thất bại";
      toast.showError(errorMessage);
    },
  });
}

export function useLogin() {
  const toast = useToast();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  return useMutation<AuthResponse, ApiError, LoginInput>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace(ROUTES.HOME);
    },
    onError: (error: ApiError) => {
      const errorMessage = error.message || "Đăng nhập thất bại";
      toast.showError(errorMessage, { title: "Lỗi đăng nhập" });
    },
  });
}
