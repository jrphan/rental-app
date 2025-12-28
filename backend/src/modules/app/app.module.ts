import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { AppService } from '@/modules/app/app.service';
import { AppController } from '@/modules/app/app.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { LoggerModule } from '@/modules/logger/logger.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { FileModule } from '@/modules/file/file.module';
import { UserModule } from '@/modules/user/user.module';
import { VehicleModule } from '@/modules/vehicle/vehicle.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { RentalModule } from '@/modules/rental/rental.module';
import { ChatModule } from '@/modules/chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    LoggerModule,
    RedisModule,
    AuthModule,
    FileModule,
    UserModule,
    VehicleModule,
    NotificationModule,
    RentalModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
