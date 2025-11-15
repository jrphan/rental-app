import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from '@/modules/user/user.service';
import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '@/common/dto/User';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '@/common/dto/Response/response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';

export type UserResponse = Omit<User, 'password'>;

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo user mới' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User được tạo thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponse> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách users' })
  @ApiQuery({ type: QueryUserDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách users được trả về thành công',
    type: PaginatedResponseDto,
  })
  async findAll(@Query() queryUserDto: QueryUserDto) {
    return this.userService.findAll(queryUserDto);
  }

  // ===== Owner Application Routes (must be before :id route) =====
  @Get('owner-application/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Xem trạng thái yêu cầu làm chủ xe của tôi' })
  async getMyOwnerApplication(@GetUser() user: Omit<User, 'password'>) {
    return this.userService.getMyOwnerApplication(user.id);
  }

  @Get('owner-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - danh sách yêu cầu làm chủ xe' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listOwnerApplications(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.listOwnerApplications(
      status as any,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin user theo ID' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin user được trả về thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin user' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User được cập nhật thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa user' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({
    status: 204,
    description: 'User được xóa thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Vô hiệu hóa user (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID của user' })
  @ApiResponse({
    status: 200,
    description: 'User được vô hiệu hóa thành công',
    type: ApiResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async deactivateUser(@Param('id') id: string): Promise<UserResponse> {
    return this.userService.softDeleteUser(id);
  }

  // ===== Owner Application =====
  @Post('owner-application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Người dùng gửi yêu cầu đăng ký làm chủ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { notes: { type: 'string' } },
    },
  })
  async submitOwnerApplication(
    @GetUser() user: Omit<User, 'password'>,
    @Body() body: { notes?: string },
  ) {
    return this.userService.submitOwnerApplication(user.id, body.notes);
  }

  @Post('owner-applications/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - duyệt yêu cầu làm chủ xe' })
  async approveOwnerApplication(@Param('id') id: string) {
    return this.userService.approveOwnerApplication(id);
  }

  @Post('owner-applications/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('JWT-auth')
  @ApiOperation({ summary: 'Admin - từ chối yêu cầu làm chủ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { notes: { type: 'string' } },
    },
  })
  async rejectOwnerApplication(
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.userService.rejectOwnerApplication(id, body.notes);
  }
}
