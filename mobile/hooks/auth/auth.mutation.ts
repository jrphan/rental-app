import {
  authApi,
  AuthResponse,
  ForgotPasswordResponse,
  RegisterResponse,
} from "@/services/api.auth";
import { ApiError } from "@/types/api.types";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@/schemas/auth.schema";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";
import { useMutation } from "@tanstack/react-query";

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

export function useForgotPassword() {
  const toast = useToast();
  const router = useRouter();
  return useMutation<ForgotPasswordResponse, ApiError, ForgotPasswordInput>({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_data, variables) => {
      const email = variables.email;
      toast.showSuccess(
        "Nếu email tồn tại, mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email và nhập mã OTP để đặt lại mật khẩu.",
        {
          title: "Đã gửi OTP",
          onPress: () => {
            if (email) {
              router.push({
                pathname: ROUTES.RESET_PASSWORD,
                params: { email },
              });
            }
          },
          duration: 3000,
        }
      );
      setTimeout(() => {
        if (email) {
          router.push({
            pathname: ROUTES.RESET_PASSWORD,
            params: { email },
          });
        }
      }, 1000);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gửi OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi gửi OTP" });
    },
  });
}
