import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { User, UserRole, Prisma } from '@/generated/prisma';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '@/common/dto/User';
import {
  createPaginatedResponse,
  // createResponse,
} from '@/common/utils/response.util';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    this.logger.log(`Tạo user mới: ${createUserDto.email}`);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        isActive: createUserDto.isActive ?? true,
        isVerified: createUserDto.isVerified ?? false,
        role: createUserDto.role ?? UserRole.RENTER,
      },
    });

    // Loại bỏ password khỏi response
    const { password, ...userWithoutPassword } = user;
    console.log(password);
    this.logger.log(`Tạo user thành công: ${createUserDto.email}`);

    return userWithoutPassword as Omit<User, 'password'>;
  }

  async findAll(queryUserDto: QueryUserDto) {
    const { search, role, isActive, page = 1, limit = 10 } = queryUserDto;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          isActive: true,
          isVerified: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResponse(
      users,
      { page, limit, total },
      'Lấy danh sách users thành công',
      '/api/users',
    );
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Tìm user với ID: ${id}`);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`User không tồn tại: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.debug(`Tìm thấy user: ${user.email}`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    this.logger.log(`Cập nhật user: ${id}`);
    await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Cập nhật user thành công: ${id}`);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    this.logger.warn(`Xóa user: ${id}`);
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.warn(`Xóa user thành công: ${id}`);
  }

  async softDeleteUser(id: string): Promise<Omit<User, 'password'>> {
    this.logger.warn(`Soft delete user: ${id}`);
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.warn(`Soft delete user thành công: ${id}`);
    return user;
  }
}
