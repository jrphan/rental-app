import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry nhẹ nhàng, dữ liệu tươi trong 30s
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  profile: {
    detail: (userId?: string | null) => ["profile", userId] as const,
  },
  gallery: {
    list: (folder: string) => ["gallery", folder] as const,
  },
};
