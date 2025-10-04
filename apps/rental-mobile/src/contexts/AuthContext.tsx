import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { apiService } from "../services/api";
import Toast from "react-native-toast-message";

import {
  User,
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from "@rental-app/shared-types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Load saved auth data on app start
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("auth_token");
      const savedUser = await AsyncStorage.getItem("user_data");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Verify token is still valid
        try {
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            // Update React Query cache
            queryClient.setQueryData(queryKeys.auth.profile, response.data);
          } else {
            // Clear auth data if profile fetch fails
            setUser(null);
            setToken(null);
            await AsyncStorage.multiRemove([
              "auth_token",
              "refresh_token",
              "user_data",
            ]);
          }
        } catch (error) {
          // Clear auth data if profile fetch fails
          setUser(null);
          setToken(null);
          await AsyncStorage.multiRemove([
            "auth_token",
            "refresh_token",
            "user_data",
          ]);
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with React Query cache and AsyncStorage
  useEffect(() => {
    const syncAuthState = async () => {
      const savedToken = await AsyncStorage.getItem("auth_token");
      const savedUser = await AsyncStorage.getItem("user_data");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Also update React Query cache
        queryClient.setQueryData(queryKeys.auth.profile, JSON.parse(savedUser));
      }
    };

    syncAuthState();
  }, [queryClient]);

  // Listen to React Query cache changes for user data
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.query.queryKey[0] === "auth" &&
        event.query.queryKey[1] === "profile"
      ) {
        const userData = queryClient.getQueryData<User>(queryKeys.auth.profile);
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
          setToken(null);
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
