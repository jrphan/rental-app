import { authApi } from "@/services/api.auth";
import {
  LoginResponse,
  LoginWithNoVerifyPhoneResponse,
  RegisterResponse,
  ForgotPasswordResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  VerifyResetPasswordResponse,
} from "@/types/auth.types";
import { ApiError } from "@/types/api.types";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
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
      toast.showSuccess(data.message, { title: "Đăng ký thành công" });
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

  return useMutation<
    LoginResponse | LoginWithNoVerifyPhoneResponse,
    ApiError,
    LoginInput
  >({
    mutationFn: authApi.login,
    onSuccess: (data, variables) => {
      if (data.message) {
        toast.showSuccess(data.message, { title: "Đăng nhập thành công" });
        if (data.userId) {
          router.push(ROUTES.VERIFY_OTP([data.userId, variables.phone]));
        }
      } else {
        const userData = data as LoginResponse;
        login(
          {
            id: userData.user.id,
            phone: userData.user.phone,
            email: userData.user.email,
            fullName: userData.user.fullName,
            role: userData.user.role,
            isActive: userData.user.isActive,
            isPhoneVerified: userData.user.isPhoneVerified,
          },
          {
            accessToken: userData.accessToken,
            refreshToken: userData.refreshToken,
          }
        );
        router.replace(ROUTES.HOME);
      }
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
    onSuccess: (data, variables) => {
      const phone = variables.phone;
      toast.showSuccess(data.message, { title: "Đã gửi OTP" });

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
    VerifyOtpResponse,
    ApiError,
    { userId: string; otpCode: string }
  >({
    mutationFn: ({ userId, otpCode }) => authApi.verifyOTP(userId, otpCode),
    onSuccess: (data) => {
      console.log("data", data);
      toast.showSuccess(data.message, { title: "Xác thực thành công" });
      router.replace(ROUTES.LOGIN);
    },
    onError: (error: ApiError) => {
      const errorMessage = error?.message || "Xác thực OTP thất bại";
      toast.showError(errorMessage, { title: "Lỗi xác thực OTP" });
    },
  });
}

export function useResendOTP() {
  const toast = useToast();
  return useMutation<ResendOtpResponse, ApiError, { userId: string }>({
    mutationFn: ({ userId }) => authApi.resendOTP(userId),
    onSuccess: (data) => {
      console.log("data resend OTP", data);
      toast.showSuccess(data.message, { title: "Đã gửi lại mã OTP" });
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

export function useResetPassword() {
  const toast = useToast();
  const router = useRouter();

  return useMutation<VerifyResetPasswordResponse, ApiError, ResetPasswordInput>({
    mutationFn: ({ phone, otpCode, newPassword }) =>
      authApi.resetPassword(phone, otpCode, newPassword),
    onSuccess: (data) => {
      toast.showSuccess(data.message, { title: "Đặt lại mật khẩu thành công" });
      router.replace(ROUTES.LOGIN);
    },
    onError: (error) => {
      const errorMessage = error?.message || "Đặt lại mật khẩu thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
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
