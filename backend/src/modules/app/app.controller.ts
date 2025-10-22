import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from '@/modules/app/app.service';
import { ApiResponseDto } from '@/common/dto/Response/response.dto';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
}
