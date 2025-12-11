import { Injectable } from '@nestjs/common';
import { RedisService } from '@/modules/redis/redis.service';
import { ENV } from '@/config/env';
import { LOG_CATEGORY, LoggerService } from '@/modules/logger/logger.service';

@Injectable()
export class RateLimitService {
  constructor(
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Kiểm tra và tăng số lần gửi OTP cho một phone number
   * @param phone Số điện thoại
   * @returns true nếu được phép gửi, false nếu đã vượt quá giới hạn
   */
  async checkOTPRateLimit(phone: string): Promise<boolean> {
    const key = `otp:rate_limit:${phone}`;
    const windowSeconds = ENV.otpRateLimit.windowMinutes * 60;

    try {
      const currentCount = await this.redisService.incr(key);

      if (currentCount === null) {
        // Nếu Redis lỗi, cho phép gửi để không block service
        return true;
      }

      // Nếu key mới được tạo (count = 1), set expiration
      if (currentCount === 1) {
        await this.redisService.set(key, '1', windowSeconds);
      } else {
        // Kiểm tra TTL để đảm bảo expiration được set
        const ttl = await this.redisService.ttl(key);
        if (ttl === -1) {
          // Nếu không có expiration, set lại
          await this.redisService.set(
            key,
            currentCount.toString(),
            windowSeconds,
          );
        }
      }

      const maxAttempts = ENV.otpRateLimit.maxAttempts;

      if (currentCount > maxAttempts) {
        const remainingSeconds = await this.redisService.ttl(key);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);

        void this.loggerService.log(
          `OTP rate limit exceeded for phone ${phone}. Attempts: ${currentCount}/${maxAttempts}. Retry after ${remainingMinutes} minutes`,
          { phone, attempts: currentCount, maxAttempts },
          { category: LOG_CATEGORY.AUTH },
        );

        return false;
      }

      return true;
    } catch (error) {
      // Nếu Redis lỗi, cho phép gửi để không block service
      void this.loggerService.error(
        `Redis error in rate limit check for phone ${phone}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      return true;
    }
  }

  /**
   * Lấy thông tin rate limit hiện tại
   * @param phone Số điện thoại
   * @returns Thông tin về số lần đã gửi và thời gian còn lại
   */
  async getOTPRateLimitInfo(phone: string): Promise<{
    attempts: number;
    maxAttempts: number;
    remainingSeconds: number;
    canSend: boolean;
  }> {
    const key = `otp:rate_limit:${phone}`;
    const maxAttempts = ENV.otpRateLimit.maxAttempts;

    try {
      const countStr = await this.redisService.get(key);
      const attempts = countStr ? parseInt(countStr, 10) : 0;
      const remainingSeconds = await this.redisService.ttl(key);
      const canSend = attempts < maxAttempts;

      return {
        attempts,
        maxAttempts,
        remainingSeconds: remainingSeconds > 0 ? remainingSeconds : 0,
        canSend,
      };
    } catch (error) {
      void this.loggerService.error(
        `Redis error getting rate limit info for phone ${phone}`,
        error,
        { category: LOG_CATEGORY.AUTH },
      );
      return {
        attempts: 0,
        maxAttempts,
        remainingSeconds: 0,
        canSend: true,
      };
    }
  }

  /**
   * Reset rate limit cho một phone number (dùng cho testing hoặc admin)
   * @param phone Số điện thoại
   */
  async resetOTPRateLimit(phone: string): Promise<void> {
    const key = `otp:rate_limit:${phone}`;
    await this.redisService.del(key);
  }
}
