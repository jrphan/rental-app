import { Controller, Post, Get, Put, Body, Headers, HttpException, Req, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
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
import type { Request } from 'express';
import {
  createSuccessResponse,
  createErrorResponse,
  RESPONSE_MESSAGES,
  HTTP_STATUS
} from '@rental-app/shared-utils';

export interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * User login
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result: LoginResponse = await this.authService.login(loginDto, ipAddress, userAgent);
      return createSuccessResponse(RESPONSE_MESSAGES.LOGIN_SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.INVALID_CREDENTIALS,
        errorMessage || 'Login failed',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Change password
   */
  @Put('change_password')
  async changePassword(
    @Headers('authorization') authHeader: string,
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      await this.authService.changePassword(token, body.oldPassword, body.newPassword);

      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, null, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Change password failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.VALIDATION_ERROR,
        errorMessage || 'Change password failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Update user profile
   */
  @Put('profile')
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string | null },
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const user: User = await this.authService.updateProfile(token, body);

      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, user, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.VALIDATION_ERROR,
        errorMessage || 'Update failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * User registration
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result: RegisterResponse = await this.authService.register(registerDto, ipAddress, userAgent);
      return createSuccessResponse(RESPONSE_MESSAGES.REGISTRATION_SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.VALIDATION_ERROR,
        errorMessage || 'Registration failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Get user profile
   */
  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const user: User = await this.authService.getProfile(token);

      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, user, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unauthorized';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.UNAUTHORIZED,
        errorMessage || 'Unauthorized',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Refresh token
   */
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto, @Req() req: Request) {
    try {
      const result: RefreshTokenResponse = await this.authService.refreshToken(body.refreshToken);
      return createSuccessResponse(RESPONSE_MESSAGES.SUCCESS, result, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      const errorResponse = createErrorResponse(
        errorMessage || RESPONSE_MESSAGES.INVALID_TOKEN,
        errorMessage || 'Token refresh failed',
        HTTP_STATUS.UNAUTHORIZED,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  /**
   * Logout
   */
  @Post('logout')
  async logout(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      await this.authService.logout(token);

      return createSuccessResponse(RESPONSE_MESSAGES.LOGOUT_SUCCESS, null, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Logout failed',
        errorMessage || 'Logout failed',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }


  // ========== KYC ENDPOINTS ==========

  /**
   * Upload KYC document
   */
  @Post('kyc/upload')
  async uploadKycDocument(
    @Headers('authorization') authHeader: string,
    @Body() body: UploadKycDocumentDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const document: KycDocument = await this.authService.uploadKycDocument(token, body);

      return createSuccessResponse('Tài liệu đã được tải lên thành công', document, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Tải lên tài liệu thất bại',
        errorMessage || 'Tải lên tài liệu thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Get user's KYC documents
   */
  @Get('kyc/documents')
  async getKycDocuments(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const documents: KycDocument[] = await this.authService.getKycDocuments(token);

      return createSuccessResponse('Lấy danh sách tài liệu thành công', documents, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Get documents failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Lấy danh sách tài liệu thất bại',
        errorMessage || 'Lấy danh sách tài liệu thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Review KYC document (Admin only)
   */
  @Put('kyc/review/:documentId')
  async reviewKycDocument(
    @Headers('authorization') authHeader: string,
    @Body() body: ReviewKycDocumentDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const documentId = (req.params as any).documentId;
      const document: KycDocument = await this.authService.reviewKycDocument(token, documentId, body);

      return createSuccessResponse('Duyệt tài liệu thành công', document, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Review failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Duyệt tài liệu thất bại',
        errorMessage || 'Duyệt tài liệu thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  // ========== ADDRESS ENDPOINTS ==========

  /**
   * Create user address
   */
  @Post('addresses')
  async createAddress(
    @Headers('authorization') authHeader: string,
    @Body() body: CreateAddressDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const address: UserAddress = await this.authService.createAddress(token, body);

      return createSuccessResponse('Tạo địa chỉ thành công', address, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Create address failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Tạo địa chỉ thất bại',
        errorMessage || 'Tạo địa chỉ thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Get user addresses
   */
  @Get('addresses')
  async getUserAddresses(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const addresses: UserAddress[] = await this.authService.getUserAddresses(token);

      return createSuccessResponse('Lấy danh sách địa chỉ thành công', addresses, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Get addresses failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Lấy danh sách địa chỉ thất bại',
        errorMessage || 'Lấy danh sách địa chỉ thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Update user address
   */
  @Put('addresses/:addressId')
  async updateAddress(
    @Headers('authorization') authHeader: string,
    @Body() body: UpdateAddressDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const addressId = (req.params as any).addressId;
      const address: UserAddress = await this.authService.updateAddress(token, addressId, body);

      return createSuccessResponse('Cập nhật địa chỉ thành công', address, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Update address failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Cập nhật địa chỉ thất bại',
        errorMessage || 'Cập nhật địa chỉ thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Delete user address
   */
  @Delete('addresses/:addressId')
  async deleteAddress(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const addressId = (req.params as any).addressId;
      await this.authService.deleteAddress(token, addressId);

      return createSuccessResponse('Xóa địa chỉ thành công', null, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Delete address failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Xóa địa chỉ thất bại',
        errorMessage || 'Xóa địa chỉ thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  // ========== PAYMENT METHOD ENDPOINTS ==========

  /**
   * Create payment method
   */
  @Post('payment-methods')
  async createPaymentMethod(
    @Headers('authorization') authHeader: string,
    @Body() body: CreatePaymentMethodDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const paymentMethod: PaymentMethod = await this.authService.createPaymentMethod(token, body);

      return createSuccessResponse('Tạo phương thức thanh toán thành công', paymentMethod, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Create payment method failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Tạo phương thức thanh toán thất bại',
        errorMessage || 'Tạo phương thức thanh toán thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Get user payment methods
   */
  @Get('payment-methods')
  async getPaymentMethods(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const paymentMethods: PaymentMethod[] = await this.authService.getPaymentMethods(token);

      return createSuccessResponse('Lấy danh sách phương thức thanh toán thành công', paymentMethods, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Get payment methods failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Lấy danh sách phương thức thanh toán thất bại',
        errorMessage || 'Lấy danh sách phương thức thanh toán thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Update payment method
   */
  @Put('payment-methods/:paymentMethodId')
  async updatePaymentMethod(
    @Headers('authorization') authHeader: string,
    @Body() body: UpdatePaymentMethodDto,
    @Req() req: Request
  ) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const paymentMethodId = (req.params as any).paymentMethodId;
      const paymentMethod: PaymentMethod = await this.authService.updatePaymentMethod(token, paymentMethodId, body);

      return createSuccessResponse('Cập nhật phương thức thanh toán thành công', paymentMethod, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Update payment method failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Cập nhật phương thức thanh toán thất bại',
        errorMessage || 'Cập nhật phương thức thanh toán thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }

  /**
   * Delete payment method
   */
  @Delete('payment-methods/:paymentMethodId')
  async deletePaymentMethod(@Headers('authorization') authHeader: string, @Req() req: Request) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
      }

      const token = authHeader.substring(7);
      const paymentMethodId = (req.params as any).paymentMethodId;
      await this.authService.deletePaymentMethod(token, paymentMethodId);

      return createSuccessResponse('Xóa phương thức thanh toán thành công', null, req.path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Delete payment method failed';
      const errorResponse = createErrorResponse(
        errorMessage || 'Xóa phương thức thanh toán thất bại',
        errorMessage || 'Xóa phương thức thanh toán thất bại',
        HTTP_STATUS.BAD_REQUEST,
        req.path
      );
      throw new HttpException(errorResponse, HTTP_STATUS.BAD_REQUEST);
    }
  }
}
