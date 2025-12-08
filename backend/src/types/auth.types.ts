import { User } from '@prisma/client';

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}
