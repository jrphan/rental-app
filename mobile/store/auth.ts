import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storage } from "@/lib/async-storage";

// Custom storage adapter for Zustand using AsyncStorage
const zustandStorage = storage;

export type UserRole = "USER" | "ADMIN" | "SUPPORT";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_UPDATE";

export interface Kyc {
  id: string;
  status: KycStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface User {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  isActive: boolean;
  isPhoneVerified: boolean;
  role: UserRole;
  isVendor: boolean;
  stripeAccountId: string | null;
  stripeStatus: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  kyc: Kyc | null;
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
  expiresAt: number | null;
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
  expiresAt: number | null;
} = {
  user: null,
  token: null,
  refreshToken: null,
  expiresAt: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      login: (user: User, tokens: AuthTokens) => {
        // Extract expiresAt from token if not provided
        let expiresAt = tokens.expiresAt || null;
        if (!expiresAt && tokens.accessToken) {
          try {
            const payload = JSON.parse(atob(tokens.accessToken.split(".")[1]));
            expiresAt = payload.exp ? payload.exp * 1000 : null;
          } catch {
            // Ignore parse errors
          }
        }

        authCache = {
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt,
        };
        set({
          user,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt,
          isAuthenticated: true,
        });
      },
      logout: () => {
        authCache = {
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
        };
        set({
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
        });
      },
      updateUser: (userUpdates: Partial<User>) => {
        set((state) => {
          const updatedUser = state.user
            ? { ...state.user, ...userUpdates }
            : null;
          // Đồng bộ authCache khi update user
          if (updatedUser) {
            authCache = { ...authCache, user: updatedUser };
          }
          return { user: updatedUser };
        });
      },
      updateTokens: (tokens: AuthTokens) => {
        // Extract expiresAt from token if not provided
        let expiresAt = tokens.expiresAt || null;
        if (!expiresAt && tokens.accessToken) {
          try {
            const payload = JSON.parse(atob(tokens.accessToken.split(".")[1]));
            expiresAt = payload.exp ? payload.exp * 1000 : null;
          } catch {
            // Ignore parse errors
          }
        }

        authCache = {
          ...authCache,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || authCache.refreshToken,
          expiresAt: expiresAt || authCache.expiresAt,
        };
        set({
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt,
        });
      },
      clearCache: () => {
        authCache = {
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
        };
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandStorage as any),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state?.token) {
          // Check if token is expired before restoring
          const isExpired = isTokenExpired(state.token);
          if (isExpired) {
            // Token expired, clear auth state
            authCache = {
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
            };
            return {
              user: null,
              token: null,
              refreshToken: null,
              expiresAt: null,
              isAuthenticated: false,
            };
          }

          authCache = {
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken || null,
            expiresAt: state.expiresAt || null,
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
