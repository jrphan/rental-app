import { Module, Logger } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ENV } from '@/config/env';

const logger = new Logger('SmsModule');
logger.log(
  `Twilio SMS service cấu hình: ${Boolean(ENV.twilio?.accountSid && ENV.twilio?.authToken)}`,
);

@Module({
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
