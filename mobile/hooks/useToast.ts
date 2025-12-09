import { useToastStore } from "@/store/toast";

/**
 * Hook để sử dụng toast dễ dàng trong components
 *
 * @example
 * const toast = useToast();
 * toast.showSuccess("Đăng nhập thành công!");
 * toast.showError("Email hoặc mật khẩu không đúng");
 */
export function useToast() {
  const show = useToastStore((state) => state.show);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const showError = useToastStore((state) => state.showError);
  const showInfo = useToastStore((state) => state.showInfo);
  const showWarning = useToastStore((state) => state.showWarning);
  const hide = useToastStore((state) => state.hide);
  const hideAll = useToastStore((state) => state.hideAll);

  return {
    show,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hide,
    hideAll,
  };
}
