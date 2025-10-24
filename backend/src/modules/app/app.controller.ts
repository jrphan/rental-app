import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '@/modules/app/app.service';
import { ApiResponseDto } from '@/common/dto/Response/response.dto';
import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái ứng dụng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông báo chào mừng',
    type: ApiResponseDto,
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái sức khỏe ứng dụng và cơ sở dữ liệu',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về trạng thái sức khỏe của ứng dụng',
    type: ApiResponseDto,
  })
  async getHealth() {
    const dbStatus = this.prismaService.getConnectionStatus();
    const isDbHealthy = await this.prismaService.checkConnection();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbStatus,
        healthy: isDbHealthy,
        message:
          dbStatus && isDbHealthy
            ? 'Database is connected and healthy'
            : 'Database is not available',
      },
    };
  }
}
