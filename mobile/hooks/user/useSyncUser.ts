import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { apiUser } from "@/services/api.user";
import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";

/**
 * Hook để sync thông tin user với server mỗi lần app khởi động
 * Nếu API fail (token hết hạn hoặc user không tồn tại) thì tự động logout
 */
export function useSyncUser() {
  const { user, token, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const hasLoggedOutRef = useRef(false);

  const { data, isError } = useQuery({
    queryKey: ["user", "sync"],
    queryFn: apiUser.getUserInfo,
    enabled: !!token && !!user && !hasLoggedOutRef.current, // Chỉ gọi khi có token và user và chưa logout
    retry: false, // Không retry, nếu fail thì logout ngay
    staleTime: 0, // Luôn fetch fresh data khi app khởi động
    gcTime: 0, // Không cache
    refetchOnMount: true, // Luôn refetch khi component mount
  });

  // Reset ref khi user login lại (token/user thay đổi từ null sang có giá trị)
  useEffect(() => {
    if (token && user) {
      hasLoggedOutRef.current = false;
    }
  }, [token, user]);

  useEffect(() => {
    // Nếu API thành công, update user trong store
    if (data) {
      updateUser(data);
    }
  }, [data, updateUser]);

  useEffect(() => {
    // Nếu API fail, tự động logout (chỉ một lần)
    if (isError && token && user && !hasLoggedOutRef.current) {
      console.warn("[useSyncUser] API call failed, logging out user");
      hasLoggedOutRef.current = true;
      logout();
      router.replace(ROUTES.LOGIN);
    }
  }, [isError, token, user, logout, router]);
}
