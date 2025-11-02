import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "@/lib/async-storage";

// Custom storage adapter for Zustand using AsyncStorage
const zustandStorage = storage;

/**
 * User interface matching backend response
 */
export interface User {
  id: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateTokens: (tokens: AuthTokens) => void;
  clearCache: () => void;
}

// Cache để đồng bộ với storage
let authCache: {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
} = {
  user: null,
  token: null,
  refreshToken: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user: User, tokens: AuthTokens) => {
        authCache = {
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
        };
        set({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          isAuthenticated: true,
        });
      },
      logout: () => {
        authCache = { user: null, token: null, refreshToken: null };
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      updateUser: (userUpdates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userUpdates } : null,
        }));
      },
      updateTokens: (tokens: AuthTokens) => {
        authCache = {
          ...authCache,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || authCache.refreshToken,
        };
        set({
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
        });
      },
      clearCache: () => {
        authCache = { user: null, token: null, refreshToken: null };
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage as any),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.token) {
          authCache = {
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken || null,
          };
        }
      },
    }
  )
);

// Export cache để sử dụng trong API interceptor
export const getAuthCache = () => authCache;

// Helper để check token có hết hạn không
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
};
