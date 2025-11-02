import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
  onPress?: () => void;
}

interface ToastState {
  toasts: Toast[];
  show: (
    message: string,
    type?: ToastType,
    options?: { title?: string; duration?: number; onPress?: () => void }
  ) => void;
  showSuccess: (
    message: string,
    options?: { title?: string; duration?: number; onPress?: () => void }
  ) => void;
  showError: (
    message: string,
    options?: { title?: string; duration?: number; onPress?: () => void }
  ) => void;
  showInfo: (
    message: string,
    options?: { title?: string; duration?: number; onPress?: () => void }
  ) => void;
  showWarning: (
    message: string,
    options?: { title?: string; duration?: number; onPress?: () => void }
  ) => void;
  hide: (id: string) => void;
  hideAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = "info", options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration ?? 3000,
      onPress: options.onPress,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto hide after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }

    return id;
  },
  showSuccess: (message, options) => {
    return useToastStore.getState().show(message, "success", options);
  },
  showError: (message, options) => {
    return useToastStore.getState().show(message, "error", options);
  },
  showInfo: (message, options) => {
    return useToastStore.getState().show(message, "info", options);
  },
  showWarning: (message, options) => {
    return useToastStore.getState().show(message, "warning", options);
  },
  hide: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  hideAll: () => {
    set({ toasts: [] });
  },
}));
