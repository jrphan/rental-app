import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(options: MailOptions) {
    try {
      const result = (await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context || {},
      })) as { messageId?: string };

      this.logger.log(
        `Email sent successfully to: ${options.to} - ${options.subject}`,
      );

      // Safely access messageId
      const messageId = result?.messageId || 'unknown';
      this.logger.debug(`Message ID: ${messageId}`);

      return {
        success: true,
        message: 'Email đã được gửi thành công',
        messageId,
      };
    } catch (error) {
      this.logger.error('Error sending email:', error);

      // Log specific error details for debugging
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);

        // Safely access error properties
        const errorDetails = error as Error & {
          code?: string;
          command?: string;
        };
        if (errorDetails.code) {
          this.logger.error(`Error code: ${errorDetails.code}`);
        }
        if (errorDetails.command) {
          this.logger.error(`Error command: ${errorDetails.command}`);
        }

        // Provide more specific error messages
        if (
          error.message.includes('timeout') ||
          error.message.includes('ETIMEDOUT')
        ) {
          this.logger.error(
            'Connection timeout - có thể do Render block SMTP ports. Khuyến nghị sử dụng API-based email service (Resend, SendGrid)',
          );
        } else if (error.message.includes('ECONNREFUSED')) {
          this.logger.error(
            'Connection refused - SMTP server không khả dụng hoặc sai host/port',
          );
        } else if (
          error.message.includes('EAUTH') ||
          error.message.includes('authentication')
        ) {
          this.logger.error(
            'Authentication failed - kiểm tra MAIL_USER và MAIL_PASSWORD',
          );
        } else if (error.message.includes('TLS')) {
          this.logger.error(
            'TLS handshake failed - kiểm tra MAIL_SECURE và certificate',
          );
        }
      }

      return {
        success: false,
        message: 'Không thể gửi email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: 'Chào mừng bạn đến với Rental App',
      template: 'welcome',
      context: { name },
    });
  }

  async sendVerificationEmail(email: string, verificationCode: string) {
    return this.sendEmail({
      to: email,
      subject: 'Xác thực email của bạn',
      template: 'verification',
      context: { verificationCode },
    });
  }

  async sendForgotPasswordEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: email,
      subject: 'Đặt lại mật khẩu',
      template: 'forgot-password',
      context: { resetUrl },
    });
  }

  async sendBookingConfirmationEmail(
    email: string,
    bookingDetails: Record<string, unknown>,
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Xác nhận đặt xe thành công',
      template: 'booking-confirmation',
      context: bookingDetails,
    });
  }

  async sendBookingStatusUpdateEmail(
    email: string,
    status: string,
    bookingId: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: `Cập nhật trạng thái đặt xe #${bookingId}`,
      template: 'booking-status-update',
      context: { status, bookingId },
    });
  }
}
