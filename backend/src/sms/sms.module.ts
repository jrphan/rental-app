import { Module, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ENV } from '@/config/env';

const logger = new Logger('SmsModule');
logger.log(
  `SMS service provider: ${ENV.sms?.provider || 'development'} - ${ENV.sms?.provider === 'production' ? 'AWS SNS' : 'Development Mode (Logging only)'}`,
);

@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
