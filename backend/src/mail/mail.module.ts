import { Module, Logger } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { ENV } from '@/config/env';

const isEmailConfigured = ENV.mailUser && ENV.mailPassword && ENV.mailHost;

const logger = new Logger('MailModule');
logger.log(`Email được cấu hình: ${isEmailConfigured}`);

@Module({
  imports: [
    MailerModule.forRoot({
      transport: isEmailConfigured
        ? {
            host: ENV.mailHost,
            port: ENV.mailPort,
            secure: ENV.mailSecure,
            auth: {
              user: ENV.mailUser,
              pass: ENV.mailPassword,
            },
            // Fix connection timeout issues on Render
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000, // 10 seconds
            socketTimeout: 10000, // 10 seconds
            // Pool connections for better performance
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            // Additional options for better reliability
            logger: false, // Disable verbose logging
            debug: false, // Disable debug output
            // TLS options
            tls: {
              // Reject unauthorized certificates (set to false if using self-signed certs)
              rejectUnauthorized: true,
            },
            // Retry logic
            requireTLS: false,
            ignoreTLS: false,
          }
        : {
            // Mock transport for development without email config
            jsonTransport: true,
          },
      defaults: {
        from: `"Rental App" <${ENV.mailFrom}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
