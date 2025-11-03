import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { FileModule } from '@/modules/file/file.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, MailModule, FileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
