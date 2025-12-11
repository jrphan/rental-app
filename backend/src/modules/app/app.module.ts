import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AppService } from '@/modules/app/app.service';
import { AppController } from '@/modules/app/app.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { LoggerModule } from '@/modules/logger/logger.module';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [PrismaModule, LoggerModule, RedisModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
