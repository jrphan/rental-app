import { Injectable, Logger } from '@nestjs/common';
import { ENV } from '@/config/env';
import { LOG_CATEGORY, LoggerService } from '@/modules/logger/logger.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isProduction: boolean;

  constructor(private readonly loggerService: LoggerService) {
    this.isProduction =
      process.env.NODE_ENV === 'production' &&
      ENV.sms?.provider === 'production';

    if (this.isProduction) {
      this.logger.log('SMS service initialized in PRODUCTION mode');
    } else {
      this.logger.log(
        'SMS service initialized in DEVELOPMENT mode - OTP will be logged to console and file',
      );
    }
  }

  /**
   * Gửi OTP qua SMS
   * @param phone Số điện thoại nhận OTP (format: +84901234567)
   * @param otpCode Mã OTP 6 số
   * @returns Promise với kết quả gửi SMS
   */
  async sendOTP(
    phone: string,
    otpCode: string,
  ): Promise<{
    success: boolean;
    message: string;
    messageId?: string;
  }> {
    try {
      // Format phone number (đảm bảo có country code)
      const formattedPhone = this.formatPhoneNumber(phone);

      // Message content
      const message = `Mã xác thực của bạn là: ${otpCode}. Mã có hiệu lực trong 10 phút. Không chia sẻ mã này với bất kỳ ai.`;

      // Production mode: Gửi SMS thật (AWS SNS)
      if (
        this.isProduction &&
        ENV.sms?.awsAccessKeyId &&
        ENV.sms?.awsSecretAccessKey
      ) {
        return await this.sendSMSViaAWS(formattedPhone, message);
      }

      // Development mode: Log OTP để dễ test
      return await this.sendSMSDevMode(formattedPhone, message, otpCode);
    } catch (error) {
      await this.loggerService.error('Error sending SMS', error, {
        category: LOG_CATEGORY.SMS,
      });

      return {
        success: false,
        message: `Không thể gửi SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Gửi SMS qua AWS SNS (Production)
   */
  private async sendSMSViaAWS(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      // Dynamic import AWS SDK để tránh lỗi nếu chưa cài

      let snsModule: any;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        snsModule = await import('@aws-sdk/client-sns');
      } catch {
        this.logger.error(
          '@aws-sdk/client-sns not installed. Please run: pnpm add @aws-sdk/client-sns',
        );
        throw new Error(
          'AWS SNS SDK not installed. Install with: pnpm add @aws-sdk/client-sns',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { SNSClient, PublishCommand } = snsModule;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const snsClient = new SNSClient({
        region: ENV.sms?.awsRegion || 'ap-southeast-1',
        credentials: {
          accessKeyId: ENV.sms.awsAccessKeyId!,
          secretAccessKey: ENV.sms.awsSecretAccessKey!,
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const command = new PublishCommand({
        PhoneNumber: phone,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = await snsClient.send(command);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const messageId =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        result.MessageId ||
        `aws-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      await this.loggerService.log(
        `SMS sent via AWS SNS to ${phone}. MessageId: ${String(messageId)}`,
        { phone, messageId: String(messageId) },
        { category: LOG_CATEGORY.SMS },
      );

      return {
        success: true,
        message: 'SMS đã được gửi thành công',
        messageId: String(messageId),
      };
    } catch (error) {
      await this.loggerService.error('AWS SNS error', error, {
        category: LOG_CATEGORY.SMS,
      });
      throw error;
    }
  }

  /**
   * Development mode: Log OTP để dễ test (không gửi SMS thật)
   */
  private async sendSMSDevMode(
    phone: string,
    message: string,
    otpCode: string,
  ): Promise<{ success: boolean; message: string; messageId?: string }> {
    // Sử dụng LoggerService để ghi log với format đẹp
    await this.loggerService.logFormatted(
      '📱 SMS OTP (Development Mode)',
      {
        To: phone,
        'OTP Code': otpCode,
        Message: message,
      },
      { category: LOG_CATEGORY.SMS },
    );

    return {
      success: true,
      message: 'SMS đã được gửi thành công (dev mode - check console/logs)',
      messageId: `dev-${Date.now()}`,
    };
  }

  /**
   * Format số điện thoại để đảm bảo có country code
   * Ví dụ: 0901234567 -> +84901234567 (Vietnam)
   * @param phone Số điện thoại
   * @returns Số điện thoại đã format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Nếu đã có country code (bắt đầu bằng +)
    if (phone.startsWith('+')) {
      return phone;
    }

    // Nếu bắt đầu bằng 00, thay bằng +
    if (phone.startsWith('00')) {
      return '+' + phone.substring(2);
    }

    // Nếu là số Việt Nam (10-11 số, bắt đầu bằng 0)
    if (digits.length === 10 && digits.startsWith('0')) {
      return '+84' + digits.substring(1);
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      return '+84' + digits.substring(1);
    }

    // Nếu đã có country code (11-12 số không bắt đầu bằng 0)
    if (digits.length >= 11 && !digits.startsWith('0')) {
      return '+' + digits;
    }

    // Mặc định: thêm +84 cho số Việt Nam
    return '+84' + digits;
  }
}
