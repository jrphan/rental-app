import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { apiService } from "../services/api";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
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
            setUser(response.data as User);
          } else {
            await logout();
          }
        } catch (error) {
          await logout();
        }
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);

      if (response.success && response.data) {
        const {
          user: userData,
          accessToken,
          refreshToken,
        } = response.data as {
          user: User;
          accessToken: string;
          refreshToken: string;
        };

        // Save to storage
        await AsyncStorage.setItem("auth_token", accessToken);
        await AsyncStorage.setItem("refresh_token", refreshToken);
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        // Update state
        setToken(accessToken);
        setUser(userData);

        Toast.show({
          type: "success",
          text1: "Đăng nhập thành công",
          text2: `Chào mừng ${userData.fullName}!`,
        });
      } else {
        throw new Error(response.message || "Đăng nhập thất bại");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);

      if (response.success && response.data) {
        const {
          user: newUser,
          accessToken,
          refreshToken,
        } = response.data as {
          user: User;
          accessToken: string;
          refreshToken: string;
        };

        // Save to storage
        await AsyncStorage.setItem("auth_token", accessToken);
        await AsyncStorage.setItem("refresh_token", refreshToken);
        await AsyncStorage.setItem("user_data", JSON.stringify(newUser));

        // Update state
        setToken(accessToken);
        setUser(newUser);

        Toast.show({
          type: "success",
          text1: "Đăng ký thành công",
          text2: `Chào mừng ${newUser.fullName}!`,
        });
      } else {
        throw new Error(response.message || "Đăng ký thất bại");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại",
        text2: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiService.logout();
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear storage and state
      await AsyncStorage.multiRemove([
        "auth_token",
        "refresh_token",
        "user_data",
      ]);
      setToken(null);
      setUser(null);

      Toast.show({
        type: "success",
        text1: "Đăng xuất thành công",
      });
    }
  };

  const refreshTokenFunc = async () => {
    try {
      const savedRefreshToken = await AsyncStorage.getItem("refresh_token");
      if (!savedRefreshToken) {
        throw new Error("No refresh token");
      }

      const response = await apiService.refreshToken(savedRefreshToken);

      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data as {
            accessToken: string;
            refreshToken: string;
          };

        await AsyncStorage.setItem("auth_token", accessToken);
        await AsyncStorage.setItem("refresh_token", newRefreshToken);

        setToken(accessToken);
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken: refreshTokenFunc,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
