import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/AuthService';
import { queryKeys } from '../lib/queryClient';
import {
  User,
  RegisterDto
} from '@rental-app/shared-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useRouter } from "expo-router";


// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Save tokens and user data to storage
        await AsyncStorage.multiSet([
          ['auth_token', accessToken],
          ['refresh_token', refreshToken],
          ['user_data', JSON.stringify(user)],
        ]);

        // Update auth profile query cache
        queryClient.setQueryData(queryKeys.auth.profile, user);

        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công',
          text2: `Chào mừng ${user.firstName} ${user.lastName}!`,
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng nhập thất bại';
      Toast.show({
        type: 'error',
        text1: 'Đăng nhập thất bại',
        text2: errorMessage,
      });
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterDto) => authService.register(userData),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;

        // Save tokens and user data to storage
        await AsyncStorage.multiSet([
          ['auth_token', accessToken],
          ['refresh_token', refreshToken],
          ['user_data', JSON.stringify(user)],
        ]);

        // Update auth profile query cache
        queryClient.setQueryData(queryKeys.auth.profile, user);

        Toast.show({
          type: 'success',
          text1: 'Đăng ký thành công',
          text2: `Chào mừng ${user.firstName} ${user.lastName}!`,
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Đăng ký thất bại';
      Toast.show({
        type: 'error',
        text1: 'Đăng ký thất bại',
        text2: errorMessage,
      });
    },
  });
}

// Get profile query
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch profile');
    },
    enabled: false, // Only run when explicitly called
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Refresh token mutation
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Token refresh failed');
    },
    onSuccess: async (data) => {
      const { accessToken, refreshToken } = data;

      // Save new tokens to storage
      await AsyncStorage.multiSet([
        ['auth_token', accessToken],
        ['refresh_token', refreshToken],
      ]);

      console.log('Tokens refreshed successfully');
    },
    onError: (error: any) => {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      queryClient.setQueryData(queryKeys.auth.profile, null);
      AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      // Clear all auth-related data
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);

      // Clear all query caches
      queryClient.clear();

      router.replace('/login');

      Toast.show({
        type: 'success',
        text1: 'Đăng xuất thành công',
      });
    },
    onError: async (error: any) => {
      console.error('Logout error:', error);

      // Clear data even if logout API fails
      await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
      queryClient.clear();


      Toast.show({
        type: 'success',
        text1: 'Đăng xuất thành công',
      });

      router.replace('/login');
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>) => authService.updateProfile(data),
    mutationFn: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>) => authService.updateProfile(data),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        const user = response.data;
        // Update cache and local storage
        queryClient.setQueryData(queryKeys.auth.profile, user);
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        Toast.show({ type: 'success', text1: 'Lưu thành công' });
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Lưu thất bại';
      Toast.show({ type: 'error', text1: 'Lưu thất bại', text2: msg });
    },
  });
}

// Health check query
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.auth.health,
    queryFn: async () => {
      const response = await authService.healthCheck();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Health check failed');
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

// Helper hook to get current user from storage
export function useCurrentUser() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<User>(queryKeys.auth.profile);
}

// Helper hook to check if user is authenticated
export function useIsAuthenticated() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData<User>(queryKeys.auth.profile);
  return !!user;
}
