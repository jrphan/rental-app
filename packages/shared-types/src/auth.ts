// Auth types from Prisma schema
export type User = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  isVerified: boolean;
  isActive: boolean;
  role: UserRole;
  kycStatus: KycStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
};

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type KycDocumentType = 'ID_CARD' | 'DRIVER_LICENSE' | 'PASSPORT';

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'E_WALLET' | 'BANK_TRANSFER';

export type VerificationToken = {
  id: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type TokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';

// KYC Document types
export type KycDocument = {
  id: string;
  userId: string;
  type: KycDocumentType;
  frontImage: string;
  backImage: string | null;
  status: KycStatus;
  rejectedReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// User Address types
export type UserAddress = {
  id: string;
  userId: string;
  title: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Payment Method types
export type PaymentMethod = {
  id: string;
  userId: string;
  type: PaymentMethodType;
  provider: string;
  providerId: string;
  last4: string | null;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date;
};

export type UserSession = {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
};

export type AuthAuditLog = {
  id: string;
  userId: string | null;
  eventType: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

// API Response types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthToken {
  user: User;
}

export interface RegisterResponse extends AuthToken {
  user: User;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// KYC DTOs
export interface UploadKycDocumentDto {
  type: KycDocumentType;
  frontImage: string; // Base64 or file URL
  backImage?: string; // Base64 or file URL (optional)
}

export interface ReviewKycDocumentDto {
  status: KycStatus;
  rejectedReason?: string;
}

// Address DTOs
export interface CreateAddressDto {
  title: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressDto {
  title?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

// Payment Method DTOs
export interface CreatePaymentMethodDto {
  type: PaymentMethodType;
  provider: string;
  providerId: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodDto {
  isDefault?: boolean;
  isActive?: boolean;
}
