import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import { useToast } from "../useToast";
import ROUTES from "@/constants/routes";

/**
 * Hook để check authentication và redirect nếu chưa đăng nhập
 *
 * @param options - Options cho hook
 * @param options.required - Nếu true, sẽ redirect đến login/register nếu chưa đăng nhập
 * @param options.onUnauthenticated - Callback khi chưa đăng nhập (nếu không redirect)
 * @param options.message - Message hiển thị khi chưa đăng nhập
 *
 * @returns { isAuthenticated, user, requireAuth }
 *
 * @example
 * // Check auth và redirect nếu chưa đăng nhập
 * const { requireAuth } = useRequireAuth();
 * if (!requireAuth()) {
 *   return null; // Đã redirect
 * }
 *
 * @example
 * // Check auth không redirect
 * const { isAuthenticated, user } = useRequireAuth({ required: false });
 * if (!isAuthenticated) {
 *   // Show login prompt
 * }
 */
export function useRequireAuth(options?: {
  required?: boolean;
  onUnauthenticated?: () => void;
  message?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const requireAuth = (): boolean => {
    if (isAuthenticated) {
      return true;
    }

    const message =
      options?.message || "Vui lòng đăng nhập để sử dụng tính năng này";

    if (options?.required !== false) {
      toast.showInfo(message, {
        title: "Cần đăng nhập",
        onPress: () => {
          router.push(ROUTES.LOGIN);
        },
      });
      // Redirect to login after showing toast
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 500);
      return false;
    }

    options?.onUnauthenticated?.();
    return false;
  };

  return {
    isAuthenticated,
    user,
    requireAuth,
  };
}

/**
 * Hook để check phone verification và redirect nếu chưa verify
 *
 * @param options - Options cho hook
 * @param options.required - Nếu true, sẽ redirect đến verify phone nếu chưa verify
 * @param options.onUnverified - Callback khi chưa verify (nếu không redirect)
 * @param options.message - Message hiển thị khi chưa verify
 *
 * @returns { isPhoneVerified, user, requirePhoneVerification }
 *
 * @example
 * // Check phone verification và redirect nếu chưa verify
 * const { requirePhoneVerification } = useRequirePhoneVerification();
 * if (!requirePhoneVerification()) {
 *   return null; // Đã redirect
 * }
 *
 * @example
 * // Check phone verification không redirect
 * const { isPhoneVerified, user } = useRequirePhoneVerification({ required: false });
 * if (!isPhoneVerified) {
 *   // Show verify phone prompt
 * }
 */

/**
 * Helper function để check phone verification ở bất kỳ đâu (không phải hook)
 *
 * @returns { isPhoneVerified, hasPhone, user }
 */
export function checkPhoneVerification() {
  const user = useAuthStore.getState().user;
  return {
    isPhoneVerified: user?.isPhoneVerified ?? false,
    hasPhone: !!user?.phone,
    user,
  };
}
export function checkAuth() {
  const state = useAuthStore.getState();
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  };
}

/**
 * Helper function để require auth (không phải hook)
 * Use trong các function thông thường, không phải component
 *
 * @returns boolean - true nếu đã đăng nhập, false nếu chưa đăng nhập
 */
export function requireAuth(): boolean {
  const state = useAuthStore.getState();
  return state.isAuthenticated;
}
