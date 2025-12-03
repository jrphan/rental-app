import { Module } from '@nestjs/common';
import { MailModule } from '@/mail/mail.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AppService } from '@/modules/app/app.service';
import { UserModule } from '@/modules/user/user.module';
import { FileModule } from '@/modules/file/file.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AppController } from '@/modules/app/app.controller';
import { RentalModule } from '@/modules/rental/rental.module';
import { MessageModule } from '@/modules/message/message.module';
import { VehicleModule } from '@/modules/vehicle/vehicle.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { CityModule } from '@/modules/city/city.module';
@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    MailModule,
    FileModule,
    RentalModule,
    MessageModule,
    VehicleModule,
    NotificationModule,
    CityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
