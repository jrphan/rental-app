import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(options: MailOptions) {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context || {},
      });
      return { success: true, message: 'Email đã được gửi thành công' };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, message: 'Không thể gửi email' };
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
