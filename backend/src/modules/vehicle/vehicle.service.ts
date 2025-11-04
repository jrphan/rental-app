import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@/generated/prisma';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: Prisma.VehicleCreateInput) {
    const createData = {
      ...data,
      owner: { connect: { id: ownerId } },
      status: 'DRAFT',
      isActive: true,
      isAvailable: true,
    } as unknown as Prisma.VehicleCreateInput;
    return this.prisma.vehicle.create({ data: createData });
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
    if ((v as unknown as { status?: string })?.status === 'VERIFIED') {
      throw new BadRequestException(
        'Xe đã được duyệt, không thể sửa trực tiếp',
      );
    }
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data });
  }

  async submitForReview(ownerId: string, vehicleId: string) {
    const v = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, ownerId },
    });
    if (!v) throw new NotFoundException('Không tìm thấy xe');
    if ((v as unknown as { status?: string })?.status === 'VERIFIED') {
      throw new BadRequestException('Xe đã được duyệt');
    }
    const updateData = {
      status: 'SUBMITTED',
    } as unknown as Prisma.VehicleUpdateInput;
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
    });
  }

  async listPublic(params: { cityId?: string; page?: number; limit?: number }) {
    const { cityId, page = 1, limit = 10 } = params;
    const where = {
      status: 'VERIFIED',
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
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  // Admin
  async listForReview(status: string = 'SUBMITTED', page = 1, limit = 10) {
    const where = { status } as unknown as Prisma.VehicleWhereInput;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: { owner: { select: { id: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async verify(vehicleId: string) {
    const data = { status: 'VERIFIED' } as unknown as Prisma.VehicleUpdateInput;
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data });
  }

  async reject(vehicleId: string, reason?: string) {
    const data = {
      status: 'REJECTED',
      description: reason,
    } as unknown as Prisma.VehicleUpdateInput;
    return this.prisma.vehicle.update({ where: { id: vehicleId }, data });
  }
}
