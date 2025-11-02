import { Module, Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { ENV } from '@/config/env';

const logger = new Logger('MailModule');
logger.log(`Resend API key cấu hình: ${Boolean(ENV.resendApiKey)}`);

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
