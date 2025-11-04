import {
  Body,
  Controller,
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
import { UserRole, User } from '@/generated/prisma';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  // Public list
  @Get()
  @ApiOperation({ summary: 'Danh sách xe công khai (đã VERIFY)' })
  @ApiQuery({ name: 'cityId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPublic(
    @Query('cityId') cityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehicleService.listPublic({
      cityId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  // Owner actions
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Chủ xe tạo xe (DRAFT)' })
  async create(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: import('@/generated/prisma').Prisma.VehicleCreateInput,
  ) {
    return this.vehicleService.create(user.id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Chủ xe chỉnh sửa xe (khi chưa VERIFIED)' })
  async update(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
    @Body() body: import('@/generated/prisma').Prisma.VehicleUpdateInput,
  ) {
    return this.vehicleService.update(user.id, id, body);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Chủ xe gửi duyệt xe' })
  async submit(
    @GetUser() user: Omit<User, 'password'>,
    @Param('id') id: string,
  ) {
    return this.vehicleService.submitForReview(user.id, id);
  }

  // Admin actions
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
}
