import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  // Admin actions - Must be before @Get() to avoid route conflict
  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - danh sách xe theo trạng thái duyệt' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listForReview(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehicleService.listForReview(
      status,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // Public list - Must be before param routes to avoid conflict
  @Get()
  @ApiOperation({ summary: 'Danh sách xe công khai (đã VERIFY)' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({
    name: 'vehicleTypeIds',
    required: false,
    description: 'Danh sách vehicleType id, phân tách bằng dấu phẩy',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Giá tối thiểu (dailyRate)',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Giá tối đa (dailyRate)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Các giá trị: price_asc, price_desc, distance, rating',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPublic(
    @Query('cityId') cityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vehicleTypeIds') vehicleTypeIds?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: string,
  ) {
    const params: any = {
      cityId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    if (vehicleTypeIds) {
      params.vehicleTypeIds = vehicleTypeIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    if (minPrice) params.minPrice = parseInt(minPrice, 10);
    if (maxPrice) params.maxPrice = parseInt(maxPrice, 10);
    if (sort) params.sort = sort;

    return this.vehicleService.listPublic(params);
  }

  @Get('types')
  @ApiOperation({ summary: 'Lấy danh sách loại xe' })
  async getVehicleTypes() {
    return this.vehicleService.getVehicleTypes();
  }

  @Post('types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Tạo loại xe mới (Admin only)' })
  async createVehicleType(
    @Body() body: { name: string; description?: string; icon?: string },
  ) {
    return this.vehicleService.createVehicleType(body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Lấy danh sách xe của tôi' })
  async getMyVehicles(@GetUser() user: Omit<User, 'password'>) {
    return this.vehicleService.listMyVehicles(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Lấy chi tiết xe' })
  async getById(
    @Param('id') id: string,
    @GetUser() user: Omit<User, 'password'>,
  ) {
    return this.vehicleService.getById(id, user.id);
  }

  // Vehicle Images - Must be after @Get() to avoid route conflict
  @Get(':id/images')
  @ApiOperation({ summary: 'Lấy danh sách hình ảnh của xe' })
  async getImages(@Param('id') vehicleId: string) {
    return this.vehicleService.getVehicleImages(vehicleId);
  }

  // Owner actions - Allow any authenticated user to create vehicle
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({
    summary: 'Tạo xe mới (DRAFT) - Bất kỳ user nào cũng có thể tạo',
  })
  async create(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: import('@prisma/client').Prisma.VehicleCreateInput,
  ) {
    return this.vehicleService.create(user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Chỉnh sửa xe (khi chưa VERIFIED)' })
  async update(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
    @Body() body: import('@prisma/client').Prisma.VehicleUpdateInput,
  ) {
    return this.vehicleService.update(user.id, id, body);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Gửi xe để duyệt' })
  async submit(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.vehicleService.submitForReview(user.id, id);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - duyệt xe' })
  async verify(@Param('id') id: string) {
    return this.vehicleService.verify(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - từ chối xe' })
  async reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.vehicleService.reject(id, body?.reason);
  }

  // Vehicle Images
  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Thêm hình ảnh cho xe' })
  async addImage(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') vehicleId: string,
    @Body() body: { url: string; alt?: string },
  ) {
    return this.vehicleService.addImage(user.id, vehicleId, body.url, body.alt);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Xóa hình ảnh của xe' })
  async removeImage(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') vehicleId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.vehicleService.removeImage(user.id, vehicleId, imageId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Xóa xe (chỉ cho phép với DRAFT hoặc REJECTED)' })
  async delete(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    await this.vehicleService.delete(user.id, id);
    return { message: 'Đã xóa xe thành công' };
  }
}
