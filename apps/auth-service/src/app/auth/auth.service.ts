import { Injectable } from '@nestjs/common';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends AuthToken {
  user: User;
}

@Injectable()
export class AuthService {
  // Mock data store
  private users: User[] = [
    {
      id: '1',
      email: 'user@example.com',
      fullName: 'Nguyễn Văn A',
      phone: '+84123456789',
      avatar: 'https://via.placeholder.com/150',
      role: 'user',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'admin@example.com',
      fullName: 'Admin User',
      phone: '+84987654321',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  private mockPasswords: Record<string, string> = {
    'user@example.com': 'password123',
    'admin@example.com': 'admin123',
  };

  // Mock active tokens
  private activeTokens: Set<string> = new Set();

  /**
   * User login
   */
  async login(loginDto: { email: string; password: string }): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('Email không tồn tại');
    }

    // Check password
    if (this.mockPasswords[email] !== password) {
      throw new Error('Mật khẩu không đúng');
    }

    // Generate tokens
    const accessToken = this.generateToken(user.id, 'access');
    const refreshToken = this.generateToken(user.id, 'refresh');

    // Store active token
    this.activeTokens.add(accessToken);

    return {
      user,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  /**
   * User registration
   */
  async register(registerDto: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): Promise<LoginResponse> {
    const { email, password, fullName, phone } = registerDto;

    // Check if user exists
    if (this.users.find(u => u.email === email)) {
      throw new Error('Email đã được sử dụng');
    }

    // Create new user
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      email,
      fullName,
      phone,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    // Store user and password
    this.users.push(newUser);
    this.mockPasswords[email] = password;

    // Generate tokens
    const accessToken = this.generateToken(newUser.id, 'access');
    const refreshToken = this.generateToken(newUser.id, 'refresh');

    this.activeTokens.add(accessToken);

    return {
      user: newUser,
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Get user profile by token
   */
  async getProfile(token: string): Promise<User> {
    if (!this.activeTokens.has(token)) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    const userId = this.extractUserIdFromToken(token);
    const user = this.users.find(u => u.id === userId);

    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    // In real app, validate refresh token from database
    const userId = this.extractUserIdFromToken(refreshToken);
    
    if (!userId) {
      throw new Error('Refresh token không hợp lệ');
    }

    const newAccessToken = this.generateToken(userId, 'access');
    const newRefreshToken = this.generateToken(userId, 'refresh');

    this.activeTokens.add(newAccessToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    this.activeTokens.delete(token);
  }

  /**
   * Generate mock JWT token
   */
  private generateToken(userId: string, type: 'access' | 'refresh'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${type}_${userId}_${timestamp}_${random}`;
  }

  /**
   * Extract user ID from mock token
   */
  private extractUserIdFromToken(token: string): string | null {
    try {
      const parts = token.split('_');
      return parts[1] || null;
    } catch {
      return null;
    }
  }
}
