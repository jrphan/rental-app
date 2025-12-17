import { useAuthStore } from "@/store/auth";
import { LoginResponse } from "@/types/auth.types";
import { useToast } from "@/hooks/useToast";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/types/api.types";
import { authApi } from "@/services/api.auth";

export function useUpdateProfile() {
  const toast = useToast();
  const { updateUser } = useAuthStore.getState();

  return useMutation<
    LoginResponse["user"],
    ApiError,
    Partial<Pick<LoginResponse["user"], "fullName" | "email" | "avatar">>
  >({
    mutationFn: authApi.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.showSuccess("Cập nhật hồ sơ thành công!", { title: "Thành công" });
    },
    onError: (error) => {
      const errorMessage =
        error?.message || "Cập nhật hồ sơ thất bại, vui lòng thử lại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });
}
