import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/AuthService';
import { queryKeys } from '../lib/queryClient';
import {
  User,
  RegisterDto,
  UploadKycDocumentDto,
  ReviewKycDocumentDto,
  CreateAddressDto,
  UpdateAddressDto,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto
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

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      authService.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Cập nhật mật khẩu thành công' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật mật khẩu thất bại';
      Toast.show({ type: 'error', text1: 'Cập nhật thất bại', text2: msg });
    },
  });
}


// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>) => authService.updateProfile(data),
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

// ========== KYC HOOKS ==========

// Get KYC documents query
export function useKycDocuments() {
  return useQuery({
    queryKey: queryKeys.auth.kycDocuments,
    queryFn: async () => {
      const response = await authService.getKycDocuments();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch KYC documents');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Upload KYC document mutation
export function useUploadKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadKycDocumentDto) => authService.uploadKycDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.kycDocuments });
      Toast.show({
        type: 'success',
        text1: 'Tải lên tài liệu thành công',
        text2: 'Tài liệu đang chờ duyệt',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Tải lên tài liệu thất bại';
      Toast.show({ type: 'error', text1: 'Tải lên thất bại', text2: msg });
    },
  });
}

// Review KYC document mutation (Admin only)
export function useReviewKycDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: ReviewKycDocumentDto }) =>
      authService.reviewKycDocument(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.kycDocuments });
      Toast.show({
        type: 'success',
        text1: 'Duyệt tài liệu thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Duyệt tài liệu thất bại';
      Toast.show({ type: 'error', text1: 'Duyệt thất bại', text2: msg });
    },
  });
}

// ========== ADDRESS HOOKS ==========

// Get user addresses query
export function useUserAddresses() {
  return useQuery({
    queryKey: queryKeys.auth.addresses,
    queryFn: async () => {
      const response = await authService.getUserAddresses();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch addresses');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create address mutation
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAddressDto) => authService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.addresses });
      Toast.show({
        type: 'success',
        text1: 'Tạo địa chỉ thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Tạo địa chỉ thất bại';
      Toast.show({ type: 'error', text1: 'Tạo thất bại', text2: msg });
    },
  });
}

// Update address mutation
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: UpdateAddressDto }) =>
      authService.updateAddress(addressId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.addresses });
      Toast.show({
        type: 'success',
        text1: 'Cập nhật địa chỉ thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật địa chỉ thất bại';
      Toast.show({ type: 'error', text1: 'Cập nhật thất bại', text2: msg });
    },
  });
}

// Delete address mutation
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => authService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.addresses });
      Toast.show({
        type: 'success',
        text1: 'Xóa địa chỉ thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Xóa địa chỉ thất bại';
      Toast.show({ type: 'error', text1: 'Xóa thất bại', text2: msg });
    },
  });
}

// ========== PAYMENT METHOD HOOKS ==========

// Get payment methods query
export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.auth.paymentMethods,
    queryFn: async () => {
      const response = await authService.getPaymentMethods();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch payment methods');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create payment method mutation
export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentMethodDto) => authService.createPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.paymentMethods });
      Toast.show({
        type: 'success',
        text1: 'Thêm phương thức thanh toán thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Thêm phương thức thanh toán thất bại';
      Toast.show({ type: 'error', text1: 'Thêm thất bại', text2: msg });
    },
  });
}

// Update payment method mutation
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentMethodId, data }: { paymentMethodId: string; data: UpdatePaymentMethodDto }) =>
      authService.updatePaymentMethod(paymentMethodId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.paymentMethods });
      Toast.show({
        type: 'success',
        text1: 'Cập nhật phương thức thanh toán thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Cập nhật phương thức thanh toán thất bại';
      Toast.show({ type: 'error', text1: 'Cập nhật thất bại', text2: msg });
    },
  });
}

// Delete payment method mutation
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) => authService.deletePaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.paymentMethods });
      Toast.show({
        type: 'success',
        text1: 'Xóa phương thức thanh toán thành công',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Xóa phương thức thanh toán thất bại';
      Toast.show({ type: 'error', text1: 'Xóa thất bại', text2: msg });
    },
  });
}
