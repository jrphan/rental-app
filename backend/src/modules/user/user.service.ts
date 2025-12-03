import { PrismaService } from '@/prisma/prisma.service';
import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { User, UserRole, Prisma, OwnerApplicationStatus } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from '@/common/dto/User';
import {
  createPaginatedResponse,
  // createResponse,
} from '@/common/utils/response.util';
import { NotificationService } from '@/modules/notification/notification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    this.logger.log(
      `Creating new user: ${createUserDto.email} - ${createUserDto.phone}`,
    );

    // Check if email or phone already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
        phone: createUserDto.phone,
      },
    });
    if (existingUser) {
      throw new BadRequestException('User đã tồn tại');
    }

    // Hash password using bcrypt-generated salt
    const saltRounds = 10;
    createUserDto.password = await bcrypt.hash(
      createUserDto.password,
      saltRounds,
    );

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        isActive: createUserDto.isActive ?? true,
        isVerified: createUserDto.isVerified ?? false,
        role: createUserDto.role ?? UserRole.RENTER,
      },
    });

    // Loại bỏ password khỏi response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
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
          isPhoneVerified: true,
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
        isPhoneVerified: true,
        role: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
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
        isPhoneVerified: true,
        role: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
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
        isPhoneVerified: true,
        role: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.warn(`Soft delete user thành công: ${id}`);
    return user;
  }

  // ===== Owner Application =====
  async submitOwnerApplication(userId: string, notes?: string) {
    // Enforce at least 1 verified vehicle
    const verifiedVehicleCount = await this.prisma.vehicle.count({
      where: {
        ownerId: userId,
        status: 'VERIFIED',
      } as unknown as Prisma.VehicleWhereInput,
    });
    if (verifiedVehicleCount < 1) {
      throw new BadRequestException(
        'Bạn cần có ít nhất 1 xe đã được duyệt trước khi đăng ký làm chủ xe',
      );
    }

    const existing = await this.prisma.ownerApplication.findUnique({
      where: { userId },
    });
    if (existing) {
      if (existing.status === OwnerApplicationStatus.PENDING) {
        throw new BadRequestException('Yêu cầu đang chờ duyệt');
      }
      if (existing.status === OwnerApplicationStatus.APPROVED) {
        throw new BadRequestException('Bạn đã được duyệt làm chủ xe');
      }
      // If rejected, allow resubmission by updating status back to PENDING
      return this.prisma.ownerApplication.update({
        where: { userId },
        data: { status: OwnerApplicationStatus.PENDING, notes },
      });
    }

    return this.prisma.ownerApplication.create({
      data: { userId, status: OwnerApplicationStatus.PENDING, notes },
    });
  }

  async getMyOwnerApplication(userId: string) {
    return this.prisma.ownerApplication.findUnique({ where: { userId } });
  }

  async listOwnerApplications(
    status?: OwnerApplicationStatus,
    page = 1,
    limit = 10,
  ) {
    const where: Prisma.OwnerApplicationWhereInput = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.ownerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ownerApplication.count({ where }),
    ]);

    return createPaginatedResponse(
      items,
      { page, limit, total },
      'Lấy danh sách yêu cầu chủ xe thành công',
      '/api/users/owner-applications',
    );
  }

  async approveOwnerApplication(applicationId: string) {
    const app = await this.prisma.ownerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    if (!app) throw new NotFoundException('Không tìm thấy yêu cầu');

    const result = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: app.userId },
        data: { role: UserRole.OWNER },
      }),
      this.prisma.ownerApplication.update({
        where: { id: applicationId },
        data: { status: OwnerApplicationStatus.APPROVED },
      }),
    ]);

    // Tạo thông báo cho user
    await this.notificationService.create(app.userId, {
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Đăng ký làm chủ xe đã được duyệt',
      message: `Yêu cầu đăng ký làm chủ xe của bạn đã được duyệt. Bạn giờ đã có thể cho thuê xe.`,
      data: {
        applicationId: applicationId,
        type: 'OWNER_APPLICATION_APPROVED',
      },
    });

    return { message: 'Đã duyệt yêu cầu làm chủ xe', user: result[0] };
  }

  async rejectOwnerApplication(applicationId: string, notes?: string) {
    const app = await this.prisma.ownerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    if (!app) throw new NotFoundException('Không tìm thấy yêu cầu');

    await this.prisma.ownerApplication.update({
      where: { id: applicationId },
      data: { status: OwnerApplicationStatus.REJECTED, notes },
    });

    // Tạo thông báo cho user
    await this.notificationService.create(app.userId, {
      type: 'SYSTEM_ANNOUNCEMENT',
      title: 'Đăng ký làm chủ xe bị từ chối',
      message: `Yêu cầu đăng ký làm chủ xe của bạn đã bị từ chối.${notes ? ` Lý do: ${notes}` : ''}`,
      data: {
        applicationId: applicationId,
        type: 'OWNER_APPLICATION_REJECTED',
        notes: notes,
      },
    });

    return { message: 'Đã từ chối yêu cầu làm chủ xe' };
  }
}
