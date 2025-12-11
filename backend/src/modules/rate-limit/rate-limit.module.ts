import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RedisModule } from '@/modules/redis/redis.module';
import { LoggerModule } from '@/modules/logger/logger.module';

@Module({
  imports: [RedisModule, LoggerModule],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
