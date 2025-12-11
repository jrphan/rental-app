import {
  authApi,
  AuthResponse,
  ForgotPasswordResponse,
  RegisterResponse,
} from "@/services/api.auth";
import { ApiError } from "@/types/api.types";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@/schemas/auth.schema";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRegister() {
  const toast = useToast();
  const router = useRouter();

  return useMutation<RegisterResponse, ApiError, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: (data, variables) => {
      if (data.userId) {
        router.push(ROUTES.VERIFY_OTP([data.userId, variables.phone]));
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
      const user = {
        ...data.user,
        isVerified: data.user.isPhoneVerified,
        email: data.user.email ?? undefined,
      };
      login(user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      router.replace(ROUTES.HOME);
    },
    onError: (error: any, variables: LoginInput) => {
      const errorMessage = error.message || "Đăng nhập thất bại";
      toast.showError(errorMessage, { title: "Lỗi đăng nhập" });
      if (errorMessage.includes("Tài khoản chưa được xác thực")) {
        router.push(ROUTES.VERIFY_OTP([error?.userId || "", variables.phone]));
      }
    },
  });
}

export function useForgotPassword() {
  const toast = useToast();
  const router = useRouter();
  return useMutation<ForgotPasswordResponse, ApiError, ForgotPasswordInput>({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_data, variables) => {
      const phone = variables.phone;
      toast.showSuccess(
        "Nếu số điện thoại tồn tại, mã OTP đã được gửi. Vui lòng nhập mã OTP để đặt lại mật khẩu.",
        {
          title: "Đã gửi OTP",
          onPress: () => {
            if (phone) {
              router.push({
                pathname: ROUTES.RESET_PASSWORD,
                params: { phone },
              });
            }
          },
          duration: 3000,
        }
      );
      setTimeout(() => {
        if (phone) {
          router.push({
            pathname: ROUTES.RESET_PASSWORD,
            params: { phone },
          });
        }
      }, 1000);
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Gửi OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi gửi OTP" });
    },
  });
}

export function useVerifyOTP() {
  const toast = useToast();
  const router = useRouter();

  return useMutation<
    AuthResponse,
    ApiError,
    { userId: string; otpCode: string }
  >({
    mutationFn: ({ userId, otpCode }) => authApi.verifyOTP(userId, otpCode),
    onSuccess: (data) => {
      toast.showSuccess("Chào mừng bạn đến với Rental App!", {
        title: "Xác thực thành công",
        onPress: () => router.replace(ROUTES.HOME),
        duration: 2000,
      });
      setTimeout(() => {
        router.replace(ROUTES.HOME);
      }, 1000);
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Xác thực OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi xác thực OTP" });
    },
  });
}

export function useResendOTP() {
  const toast = useToast();
  return useMutation<void, ApiError, { userId: string }>({
    mutationFn: ({ userId }) => authApi.resendOTP(userId),
    onSuccess: () => {
      toast.showSuccess("Đã gửi lại mã OTP đến email của bạn", {
        title: "Thành công",
      });
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Gửi lại OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi gửi lại OTP" });
    },
  });
}

export function useSendPhoneOTP() {
  const toast = useToast();
  return useMutation<{ message: string }, ApiError, { phone: string }>({
    mutationFn: ({ phone }) => authApi.sendPhoneOTP(phone),
    onSuccess: () => {
      toast.showSuccess("Mã OTP đã được gửi đến số điện thoại của bạn", {
        title: "Thành công",
      });
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Gửi OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi gửi OTP" });
    },
  });
}

export function useVerifyPhoneOTP() {
  const toast = useToast();
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation<
    { message: string; isPhoneVerified: boolean },
    ApiError,
    { phone: string; otpCode: string }
  >({
    mutationFn: ({ phone, otpCode }) => authApi.verifyPhoneOTP(phone, otpCode),
    onSuccess: async (data) => {
      updateUser({ isPhoneVerified: data.isPhoneVerified });

      try {
        const updatedUser = await authApi.getMe();
        updateUser(updatedUser);
      } catch {
        // Ignore error, we already updated locally
      }

      queryClient.invalidateQueries();

      toast.showSuccess("Xác minh số điện thoại thành công!", {
        title: "Thành công",
        onPress: () => router.back(),
        duration: 2000,
      });

      setTimeout(() => {
        router.back();
      }, 1000);
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Xác minh OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi xác minh OTP" });
    },
  });
}

export function useResendPhoneOTP() {
  const toast = useToast();
  return useMutation<{ message: string }, ApiError, { phone: string }>({
    mutationFn: ({ phone }) => authApi.resendPhoneOTP(phone),
    onSuccess: () => {
      toast.showSuccess("Đã gửi lại mã OTP đến số điện thoại của bạn", {
        title: "Thành công",
      });
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Gửi lại OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi gửi lại OTP" });
    },
  });
}

export function useChangePassword() {
  const toast = useToast();
  const router = useRouter();
  return useMutation<
    void,
    ApiError,
    Omit<ChangePasswordInput, "confirmPassword">
  >({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.showSuccess("Đổi mật khẩu thành công!", { title: "Thành công" });
      router.back();
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Đổi mật khẩu thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });
}
