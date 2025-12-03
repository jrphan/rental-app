import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  OnModuleInit,
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
export class VehicleService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
  ) {}

  // Ensure default vehicle types exist when module starts
  async onModuleInit() {
    await this.ensureDefaultVehicleTypes();
  }

  private async ensureDefaultVehicleTypes() {
    const defaultTypes = [
      { name: 'tay-ga', description: 'Tay ga', icon: '🏍️' },
      { name: 'xe-so', description: 'Xe số', icon: '🏍️' },
      { name: 'xe-dien', description: 'Xe điện', icon: '🔋' },
      { name: 'tay-con', description: 'Tay côn', icon: '🏍️' },
      { name: '50cc', description: '50 cc', icon: '🏍️' },
    ];

    for (const t of defaultTypes) {
      const existing = await this.prisma.vehicleType.findUnique({
        where: { name: t.name },
      });
      if (!existing) {
        try {
          await this.prisma.vehicleType.create({
            data: {
              name: t.name,
              description: t.description,
              icon: t.icon,
              isActive: true,
            },
          });
        } catch (e) {
          // ignore unique race conditions
          console.error('❌ Error seeding vehicle types:', e);
          process.exit(1);
        }
      }
    }
  }

  async create(ownerId: string, data: Prisma.VehicleCreateInput) {
    // Extract vehicleTypeId / cityId if they exist (client may send scalars)
    type InputWithExtras = Prisma.VehicleCreateInput & {
      vehicleTypeId?: string;
      cityId?: string;
    };
    const inputData = data as InputWithExtras;
    const { vehicleTypeId, cityId, ...restData } = inputData;

    // Build vehicleType relation - default to first vehicle type if not provided
    let vehicleTypeRelation = data.vehicleType;

    // If client provided vehicleTypeId scalar, prefer that (compatibility)
    if (vehicleTypeId) {
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

    // Fallback: if still not set, choose default ('tay-ga' or first active)
    if (!vehicleTypeRelation) {
      let defaultType = await this.prisma.vehicleType.findUnique({
        where: { name: 'tay-ga' },
      });
      if (!defaultType) {
        defaultType = await this.prisma.vehicleType.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        });
      }
      if (defaultType) {
        vehicleTypeRelation = { connect: { id: defaultType.id } };
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

    // Build create payload and map cityId -> nested connect if provided
    const createData: any = {
      ...(restData as Prisma.VehicleCreateInput),
      vehicleType: vehicleTypeRelation,
      owner: { connect: { id: ownerId } },
      city: { connect: { id: cityId } },
      status: VehicleStatus.DRAFT,
      isActive: true,
      isAvailable: true,
    };
    // if (cityId) {
    //   createData.city = { connect: { id: cityId } };
    // }

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

    // If client provided cityId scalar, convert to nested connect for Prisma
    const payload: any = { ...(data as any) };
    if (payload.cityId) {
      payload.city = { connect: { id: payload.cityId } };
      delete payload.cityId;
    }

    // Also allow vehicleTypeId scalar on update
    if (payload.vehicleTypeId) {
      payload.vehicleType = { connect: { id: payload.vehicleTypeId } };
      delete payload.vehicleTypeId;
    }

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: payload,
    });
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

  async listPublic(params: {
    cityId?: string;
    page?: number;
    limit?: number;
    vehicleTypeIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }) {
    const {
      cityId,
      page = 1,
      limit = 10,
      vehicleTypeIds,
      minPrice,
      maxPrice,
      sort,
    } = params;

    const where: Prisma.VehicleWhereInput = {
      status: VehicleStatus.VERIFIED,
      isActive: true,
      owner: {
        ownerApplication: {
          status: OwnerApplicationStatus.APPROVED,
        },
      },
    };

    if (cityId) where.cityId = cityId;

    if (vehicleTypeIds && vehicleTypeIds.length > 0) {
      where.vehicleTypeId = { in: vehicleTypeIds } as any;
    }

    // dailyRate filtering (assumes schema field `dailyRate` numeric)
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.AND = where.AND ?? [];
      const priceWhere: any = {};
      if (minPrice !== undefined) priceWhere.gte = minPrice;
      if (maxPrice !== undefined) priceWhere.lte = maxPrice;
      // Prisma numeric field example: dailyRate
      // add condition as { dailyRate: { gte: minPrice, lte: maxPrice } }
      (where.AND as Prisma.VehicleWhereInput[]).push({
        dailyRate: priceWhere,
      } as any);
    }

    const skip = (page - 1) * limit;

    // map sort param
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { dailyRate: 'asc' };
    else if (sort === 'price_desc') orderBy = { dailyRate: 'desc' };
    // distance / rating require extra data - left as future improvement

    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
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
          city: {
            select: { id: true, name: true, province: true, country: true },
          },
          vehicleType: { select: { id: true, name: true, description: true } },
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
    // kind: 'PHOTO' | 'DOCUMENT' = 'PHOTO',
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

    // tạo VehicleImage với field kind
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
