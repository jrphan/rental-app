import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { VehicleModule } from '@/modules/vehicle/vehicle.module';
import { RentalModule } from '@/modules/rental/rental.module';
import { FileModule } from '@/modules/file/file.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { MessageModule } from '@/modules/message/message.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    FileModule,
    VehicleModule,
    RentalModule,
    NotificationModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
