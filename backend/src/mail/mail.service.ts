import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ENV } from '@/config/env';
import { join } from 'path';
import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';

interface MailOptions {
  to: string;
  subject: string;
  template: string;
  context?: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend = new Resend(ENV.resendApiKey);

  constructor() {}

  async sendEmail(options: MailOptions) {
    try {
      const html = await this.renderTemplate(options.template, options.context);

      const sendResult: unknown = await this.resend.emails.send({
        from: `"Rental App" <${ENV.mailFrom}>`,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(
        `Email sent successfully to: ${options.to} - ${options.subject}`,
      );

      // Safely access messageId from possible result shapes
      let messageId = 'unknown';
      if (typeof sendResult === 'object' && sendResult !== null) {
        const possibleDirect = sendResult as { id?: string };
        const possibleWrapped = sendResult as { data?: { id?: string } };
        messageId = possibleDirect.id ?? possibleWrapped.data?.id ?? 'unknown';
      }
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
        // Với Resend, ưu tiên báo lỗi thiếu API key
        if (!ENV.resendApiKey) {
          this.logger.error('Thiếu RESEND_API_KEY trong biến môi trường.');
        }
      }

      return {
        success: false,
        message: 'Không thể gửi email',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any> = {},
  ): Promise<string> {
    const templatesDir = join(__dirname, 'templates');
    const candidateFiles = [
      join(templatesDir, `${templateName}.hbs`),
      join(templatesDir, `${templateName}.html`),
    ];

    let source = '';
    let lastError: unknown = null;
    for (const filePath of candidateFiles) {
      try {
        source = await readFile(filePath, 'utf8');
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!source) {
      this.logger.error(
        `Không tìm thấy template cho "${templateName}". Kiểm tra thư mục templates.`,
      );
      if (lastError) {
        this.logger.debug(
          lastError instanceof Error
            ? lastError.message
            : (() => {
                try {
                  return JSON.stringify(lastError);
                } catch {
                  return 'Unknown template read error';
                }
              })(),
        );
      }
      // fallback HTML đơn giản
      return `<p>${context?.message || 'Nội dung email trống.'}</p>`;
    }

    const compiled = Handlebars.compile(source, { strict: false });
    return compiled(context);
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
