import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  Prisma,
  OwnerApplicationStatus,
  VehicleStatus,
  UserRole,
} from '@prisma/client';
import { NotificationService } from '@/modules/notification/notification.service';

@Injectable()
export class VehicleService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  async create(ownerId: string, data: Prisma.VehicleCreateInput) {
    // Extract vehicleTypeId if it exists (from client input)
    // App chỉ cho thuê xe máy, tự động set vehicleType = "motorcycle"
    type InputWithVehicleTypeId = Prisma.VehicleCreateInput & {
      vehicleTypeId?: string;
    };
    const inputData = data as InputWithVehicleTypeId;
    const { vehicleTypeId, ...restData } = inputData;

    // Build vehicleType relation - default to "motorcycle"
    let vehicleTypeRelation = data.vehicleType;

    if (!vehicleTypeRelation) {
      // Tự động tìm và set loại xe máy
      let motorcycleType = await this.prisma.vehicleType.findUnique({
        where: { name: 'motorcycle' },
      });

      // Nếu chưa có, tạo mới
      if (!motorcycleType) {
        motorcycleType = await this.prisma.vehicleType.create({
          data: {
            name: 'motorcycle',
            description: 'Xe máy',
            icon: '🏍️',
            isActive: true,
          },
        });
      }

      vehicleTypeRelation = { connect: { id: motorcycleType.id } };
    } else if (vehicleTypeId) {
      // Nếu client gửi vehicleTypeId, vẫn xử lý (cho tương thích)
      let vehicleType = await this.prisma.vehicleType.findUnique({
        where: { id: vehicleTypeId },
      });

      if (!vehicleType && typeof vehicleTypeId === 'string') {
        vehicleType = await this.prisma.vehicleType.findUnique({
          where: { name: vehicleTypeId },
        });
      }

      if (vehicleType) {
        vehicleTypeRelation = { connect: { id: vehicleType.id } };
      }
    }

    // Check if license plate already exists
    const licensePlateValue =
      typeof restData.licensePlate === 'string'
        ? restData.licensePlate
        : undefined;

    if (licensePlateValue) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { licensePlate: licensePlateValue },
      });

      if (existingVehicle) {
        throw new BadRequestException(
          `Biển số "${licensePlateValue}" đã được sử dụng. Vui lòng sử dụng biển số khác.`,
        );
      }
    }

    const createData: Prisma.VehicleCreateInput = {
      ...(restData as Prisma.VehicleCreateInput),
      vehicleType: vehicleTypeRelation,
      owner: { connect: { id: ownerId } },
      status: VehicleStatus.DRAFT,
      isActive: true,
      isAvailable: true,
    };

    try {
      return await this.prisma.vehicle.create({ data: createData });
    } catch (error: unknown) {
      // Handle Prisma unique constraint error
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002' &&
        'meta' in error &&
        error.meta &&
        typeof error.meta === 'object' &&
        'target' in error.meta &&
        Array.isArray(error.meta.target) &&
        error.meta.target.includes('licensePlate')
      ) {
        throw new BadRequestException(
          `Biển số "${licensePlateValue || ''}" đã được sử dụng. Vui lòng sử dụng biển số khác.`,
        );
      }
      throw error;
    }
  }

  async getById(vehicleId: string, ownerId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
        vehicleType: {
          select: { id: true, name: true, description: true, icon: true },
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');
    return vehicle;
  }

  async update(
    ownerId: string,
    vehicleId: string,
    data: Prisma.VehicleUpdateInput,
  ) {
    const v = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
    });
    if (!v) throw new NotFoundException('Không tìm thấy xe');
    if (
      (v as unknown as { status?: VehicleStatus })?.status ===
      VehicleStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Xe đã được duyệt, không thể sửa trực tiếp',
      );
    }

    // Check license plate uniqueness if being updated
    if (data.licensePlate) {
      const licensePlateValue =
        typeof data.licensePlate === 'string' ? data.licensePlate : undefined;

      if (licensePlateValue) {
        const existingVehicle = await this.prisma.vehicle.findFirst({
          where: {
            licensePlate: licensePlateValue,
            id: { not: vehicleId }, // Exclude current vehicle
          },
        });

        if (existingVehicle) {
          throw new BadRequestException(
            `Biển số "${licensePlateValue}" đã được sử dụng. Vui lòng sử dụng biển số khác.`,
          );
        }
      }
    }

    return this.prisma.vehicle.update({ where: { id: vehicleId }, data });
  }

  async submitForReview(ownerId: string, vehicleId: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
      include: { images: true },
    });
    if (!v) throw new NotFoundException('Không tìm thấy xe');
    if (
      (v as unknown as { status?: VehicleStatus })?.status ===
      VehicleStatus.VERIFIED
    ) {
      throw new BadRequestException('Xe đã được duyệt');
    }

    // Yêu cầu ít nhất 1 hình ảnh khi submit để duyệt
    if (!v.images || v.images.length === 0) {
      throw new BadRequestException(
        'Vui lòng thêm ít nhất 1 hình ảnh xe trước khi gửi duyệt',
      );
    }

    const updateData = {
      status: VehicleStatus.SUBMITTED,
    } as unknown as Prisma.VehicleUpdateInput;

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Tạo thông báo cho tất cả admin
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    await Promise.all(
      admins.map(admin =>
        this.notificationService.create(admin.id, {
          type: 'RENTAL_REQUEST',
          title: 'Yêu cầu duyệt xe mới',
          message: `Có yêu cầu duyệt xe mới từ ${updatedVehicle.owner.email}. Biển số: ${updatedVehicle.licensePlate}`,
          data: {
            vehicleId: vehicleId,
            ownerId: ownerId,
            type: 'VEHICLE_SUBMITTED',
          },
        }),
      ),
    );

    return updatedVehicle;
  }

  async listMyVehicles(ownerId: string) {
    return this.prisma.vehicle.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
          take: 1, // Chỉ lấy 1 ảnh đầu tiên
        },
      },
    });
  }

  async listPublic(params: { cityId?: string; page?: number; limit?: number }) {
    const { cityId, page = 1, limit = 10 } = params;
    const where = {
      status: VehicleStatus.VERIFIED,
      isActive: true,
    } as unknown as Prisma.VehicleWhereInput;
    if (cityId) where.cityId = cityId;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
            // Trả về tất cả ảnh để hiển thị carousel
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  // Admin
  async listForReview(
    status: string = VehicleStatus.SUBMITTED,
    page = 1,
    limit = 10,
  ) {
    const where = {
      status: status as VehicleStatus,
    } as unknown as Prisma.VehicleWhereInput;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: {
          owner: { select: { id: true, email: true, phone: true } },
          images: { orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }] },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async verify(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { ownerId: true, licensePlate: true, brand: true, model: true },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');

    // Update vehicle status to VERIFIED
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: VehicleStatus.VERIFIED,
      } as unknown as Prisma.VehicleUpdateInput,
    });

    // Check if user has at least 1 verified vehicle now
    const verifiedVehicleCount = await this.prisma.vehicle.count({
      where: {
        ownerId: vehicle.ownerId,
        status: VehicleStatus.VERIFIED,
      } as unknown as Prisma.VehicleWhereInput,
    });

    // If this is the first verified vehicle, automatically submit owner application
    if (verifiedVehicleCount === 1) {
      const existingApp = await this.prisma.ownerApplication.findUnique({
        where: { userId: vehicle.ownerId },
      });

      if (!existingApp) {
        // Auto-submit owner application
        await this.prisma.ownerApplication.create({
          data: {
            userId: vehicle.ownerId,
            status: OwnerApplicationStatus.PENDING,
            notes: 'Tự động đăng ký sau khi có xe đầu tiên được duyệt',
          },
        });

        // Tạo thông báo cho tất cả admin về owner application mới
        const admins = await this.prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        const owner = await this.prisma.user.findUnique({
          where: { id: vehicle.ownerId },
          select: { email: true },
        });

        await Promise.all(
          admins.map(admin =>
            this.notificationService.create(admin.id, {
              type: 'SYSTEM_ANNOUNCEMENT',
              title: 'Yêu cầu đăng ký chủ xe mới',
              message: `Có yêu cầu đăng ký làm chủ xe từ ${owner?.email || 'người dùng'}. Yêu cầu được tự động tạo sau khi có xe được duyệt.`,
              data: {
                userId: vehicle.ownerId,
                type: 'OWNER_APPLICATION_SUBMITTED',
              },
            }),
          ),
        );
      } else if (existingApp.status === OwnerApplicationStatus.REJECTED) {
        // If previously rejected, allow resubmission
        await this.prisma.ownerApplication.update({
          where: { userId: vehicle.ownerId },
          data: {
            status: OwnerApplicationStatus.PENDING,
            notes: 'Tự động đăng ký lại sau khi có xe được duyệt',
          },
        });

        // Tạo thông báo cho tất cả admin về owner application resubmit
        const admins = await this.prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        const owner = await this.prisma.user.findUnique({
          where: { id: vehicle.ownerId },
          select: { email: true },
        });

        await Promise.all(
          admins.map(admin =>
            this.notificationService.create(admin.id, {
              type: 'SYSTEM_ANNOUNCEMENT',
              title: 'Yêu cầu đăng ký chủ xe được gửi lại',
              message: `Yêu cầu đăng ký làm chủ xe từ ${owner?.email || 'người dùng'} đã được gửi lại sau khi có xe được duyệt.`,
              data: {
                userId: vehicle.ownerId,
                type: 'OWNER_APPLICATION_RESUBMITTED',
              },
            }),
          ),
        );
      }
    }

    // Tạo thông báo cho owner
    await this.notificationService.create(vehicle.ownerId, {
      type: 'RENTAL_CONFIRMED',
      title: 'Xe đã được duyệt',
      message: `Xe ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) của bạn đã được duyệt và hiển thị công khai.`,
      data: {
        vehicleId: vehicleId,
        type: 'VEHICLE_VERIFIED',
      },
    });

    return updatedVehicle;
  }

  async reject(vehicleId: string, reason?: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { ownerId: true, licensePlate: true, brand: true, model: true },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: VehicleStatus.REJECTED,
        description: reason,
      } as unknown as Prisma.VehicleUpdateInput,
    });

    // Tạo thông báo cho owner
    await this.notificationService.create(vehicle.ownerId, {
      type: 'RENTAL_CANCELLED',
      title: 'Xe bị từ chối',
      message: `Xe ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) của bạn đã bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
      data: {
        vehicleId: vehicleId,
        type: 'VEHICLE_REJECTED',
        reason: reason,
      },
    });

    return updatedVehicle;
  }

  // Vehicle Images
  async addImage(
    ownerId: string,
    vehicleId: string,
    url: string,
    alt?: string,
  ) {
    // Verify vehicle ownership
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');

    // Check if this is the first image, set as primary
    const existingImages = await this.prisma.vehicleImage.count({
      where: { vehicleId },
    });
    const isPrimary = existingImages === 0;

    return this.prisma.vehicleImage.create({
      data: {
        vehicleId,
        url,
        alt,
        isPrimary,
        order: existingImages,
      },
    });
  }

  async removeImage(ownerId: string, vehicleId: string, imageId: string) {
    // Verify vehicle ownership
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy xe');

    // Verify image belongs to vehicle
    const image = await this.prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId },
    });
    if (!image) throw new NotFoundException('Không tìm thấy hình ảnh');

    // If removing primary image, set next image as primary
    if (image.isPrimary) {
      const nextImage = await this.prisma.vehicleImage.findFirst({
        where: { vehicleId, id: { not: imageId } },
        orderBy: { order: 'asc' },
      });
      if (nextImage) {
        await this.prisma.vehicleImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.prisma.vehicleImage.delete({ where: { id: imageId } });
  }

  async getVehicleImages(vehicleId: string) {
    return this.prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
    });
  }

  async getVehicleTypes() {
    return this.prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createVehicleType(data: {
    name: string;
    description?: string;
    icon?: string;
  }) {
    // Check if vehicle type with same name already exists
    const existing = await this.prisma.vehicleType.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Loại xe với tên "${data.name}" đã tồn tại`,
      );
    }

    return this.prisma.vehicleType.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        isActive: true,
      },
    });
  }

  async delete(ownerId: string, vehicleId: string) {
    // Verify vehicle ownership
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
    });
    if (!vehicle) {
      throw new NotFoundException('Không tìm thấy xe');
    }

    // Only allow deletion if vehicle is in DRAFT or REJECTED status
    // Prevent deletion of SUBMITTED or VERIFIED vehicles to maintain data integrity
    if (vehicle.status === VehicleStatus.SUBMITTED) {
      throw new BadRequestException(
        'Không thể xóa xe đang chờ duyệt. Vui lòng liên hệ admin để hủy yêu cầu.',
      );
    }

    if (vehicle.status === VehicleStatus.VERIFIED) {
      throw new BadRequestException(
        'Không thể xóa xe đã được duyệt. Vui lòng liên hệ admin nếu cần hỗ trợ.',
      );
    }

    // Check if vehicle has active rentals
    const activeRental = await this.prisma.rental.findFirst({
      where: {
        vehicleId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
        },
      },
    });

    if (activeRental) {
      throw new BadRequestException(
        'Không thể xóa xe đang có đơn thuê đang hoạt động.',
      );
    }

    // Delete vehicle images first (cascade delete should handle this, but explicit is better)
    await this.prisma.vehicleImage.deleteMany({
      where: { vehicleId },
    });

    // Delete the vehicle
    return this.prisma.vehicle.delete({
      where: { id: vehicleId },
    });
  }
}
