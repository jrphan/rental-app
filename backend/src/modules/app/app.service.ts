import { Injectable } from '@nestjs/common';
import { ENV } from '@/config';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello World! from ${ENV.port} port and ${ENV.globalPrefix} global prefix`;
  }
}
