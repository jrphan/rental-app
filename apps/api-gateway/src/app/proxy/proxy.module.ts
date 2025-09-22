import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService], // Export ProxyService để có thể sử dụng ở module khác nếu cần
})
export class ProxyModule {}
