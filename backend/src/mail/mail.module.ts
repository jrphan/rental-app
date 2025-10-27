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
