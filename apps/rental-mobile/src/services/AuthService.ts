import {
  RegisterDto,
  LoginResponse,
  RegisterResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  User,
  KycDocument,
  UserAddress,
  PaymentMethod,
  UploadKycDocumentDto,
  ReviewKycDocumentDto,
  CreateAddressDto,
  UpdateAddressDto,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto
} from '@rental-app/shared-types';
import { BaseApiService, ApiResponse } from './BaseApiService';

export class AuthService extends BaseApiService {
  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    });
  }

  async register(userData: RegisterDto): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>({
      url: '/auth/register',
      method: 'POST',
      data: userData,
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>({
      url: '/auth/profile',
      method: 'GET',
    });
  }

  async updateProfile(data: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>>): Promise<ApiResponse<User>> {
    return this.request<User>({
      url: '/auth/profile',
      method: 'PUT',
      data,
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.request<RefreshTokenResponse>({
      url: '/auth/refresh',
      method: 'POST',
      data: { refreshToken } as RefreshTokenDto,
    });
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: '/auth/logout',
      method: 'POST',
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: '/auth/change_password',
      method: 'PUT',
      data: { oldPassword, newPassword },
    });
  }


  // KYC endpoints
  async uploadKycDocument(data: UploadKycDocumentDto): Promise<ApiResponse<KycDocument>> {
    return this.request<KycDocument>({
      url: '/auth/kyc/upload',
      method: 'POST',
      data,
    });
  }

  async getKycDocuments(): Promise<ApiResponse<KycDocument[]>> {
    return this.request<KycDocument[]>({
      url: '/auth/kyc/documents',
      method: 'GET',
    });
  }

  async reviewKycDocument(documentId: string, data: ReviewKycDocumentDto): Promise<ApiResponse<KycDocument>> {
    return this.request<KycDocument>({
      url: `/auth/kyc/review/${documentId}`,
      method: 'PUT',
      data,
    });
  }

  // Address endpoints
  async createAddress(data: CreateAddressDto): Promise<ApiResponse<UserAddress>> {
    return this.request<UserAddress>({
      url: '/auth/addresses',
      method: 'POST',
      data,
    });
  }

  async getUserAddresses(): Promise<ApiResponse<UserAddress[]>> {
    return this.request<UserAddress[]>({
      url: '/auth/addresses',
      method: 'GET',
    });
  }

  async updateAddress(addressId: string, data: UpdateAddressDto): Promise<ApiResponse<UserAddress>> {
    return this.request<UserAddress>({
      url: `/auth/addresses/${addressId}`,
      method: 'PUT',
      data,
    });
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: `/auth/addresses/${addressId}`,
      method: 'DELETE',
    });
  }

  // Payment method endpoints
  async createPaymentMethod(data: CreatePaymentMethodDto): Promise<ApiResponse<PaymentMethod>> {
    return this.request<PaymentMethod>({
      url: '/auth/payment-methods',
      method: 'POST',
      data,
    });
  }

  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    return this.request<PaymentMethod[]>({
      url: '/auth/payment-methods',
      method: 'GET',
    });
  }

  async updatePaymentMethod(paymentMethodId: string, data: UpdatePaymentMethodDto): Promise<ApiResponse<PaymentMethod>> {
    return this.request<PaymentMethod>({
      url: `/auth/payment-methods/${paymentMethodId}`,
      method: 'PUT',
      data,
    });
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<null>> {
    return this.request<null>({
      url: `/auth/payment-methods/${paymentMethodId}`,
      method: 'DELETE',
    });
  }
}

export const authService = new AuthService();
