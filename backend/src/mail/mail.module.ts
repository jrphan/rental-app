import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';
import { ENV } from '@/config/env';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: ENV.mailHost ?? 'smtp.gmail.com',
        port: ENV.mailPort,
        secure: ENV.mailSecure,
        auth: {
          user: ENV.mailUser,
          pass: ENV.mailPassword,
        },
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
