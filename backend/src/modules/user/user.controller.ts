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
import { User } from '@/generated/prisma';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '@/common/dto/User';
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from '@/common/dto/Response/response.dto';

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
}
