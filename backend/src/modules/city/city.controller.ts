import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CityService } from './city.service';

@ApiTags('cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thành phố' })
  async list() {
    // Trả về mảng City; ResponseInterceptor sẽ đóng gói theo chuẩn ApiResponse
    return this.cityService.findAll();
  }
}
