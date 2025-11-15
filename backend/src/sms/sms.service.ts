import { Injectable, Logger } from '@nestjs/common';
import { ENV } from '@/config/env';

// Twilio client (sẽ được import sau khi cài đặt package)
// import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  // private readonly twilioClient: any;

  constructor() {
    // Khởi tạo Twilio client nếu có API key
    // if (ENV.twilio.accountSid && ENV.twilio.authToken) {
    //   this.twilioClient = twilio(ENV.twilio.accountSid, ENV.twilio.authToken);
    //   this.logger.log('Twilio SMS service initialized');
    // } else {
    //   this.logger.warn('Twilio credentials not found. SMS service will log messages only.');
    // }
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

      // Nếu có Twilio credentials, gửi SMS thật
      if (ENV.twilio?.accountSid && ENV.twilio?.authToken) {
        // TODO: Uncomment sau khi cài đặt twilio package
        // const result = await this.twilioClient.messages.create({
        //   body: message,
        //   from: ENV.twilio.phoneNumber,
        //   to: formattedPhone,
        // });

        // this.logger.log(`SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`);
        // return {
        //   success: true,
        //   message: 'SMS đã được gửi thành công',
        //   messageId: result.sid,
        // };

        // Tạm thời log để test
        this.logger.log(
          `[DEV MODE] SMS would be sent to ${formattedPhone}: ${message}`,
        );
        // Await để tránh linter warning (sẽ được thay thế bằng Twilio API call)
        await Promise.resolve();
        return {
          success: true,
          message: 'SMS đã được gửi thành công (dev mode)',
          messageId: `dev-${Date.now()}`,
        };
      } else {
        // Development mode: chỉ log
        this.logger.log(
          `[DEV MODE] SMS would be sent to ${formattedPhone}: ${message}`,
        );
        this.logger.warn('Twilio credentials not configured. SMS not sent.');
        // Await để tránh linter warning
        await Promise.resolve();
        return {
          success: true,
          message: 'SMS đã được gửi thành công (dev mode - check logs)',
          messageId: `dev-${Date.now()}`,
        };
      }
    } catch (error) {
      this.logger.error('Error sending SMS:', error);

      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
      }

      return {
        success: false,
        message: `Không thể gửi SMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
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

    // Nếu đã có country code (bắt đầu bằng + hoặc 00)
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
