import { Module } from '@nestjs/common';
import { AppController } from '@/modules/app/app.controller';
import { AppService } from '@/modules/app/app.service';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
