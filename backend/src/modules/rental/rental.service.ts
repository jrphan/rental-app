import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, RentalStatus } from '@prisma/client';

@Injectable()
export class RentalService {
  constructor(private prisma: PrismaService) {}

  async createRental(
    renterId: string,
    input: {
      vehicleId: string;
      startDate: string;
      endDate: string;
      pickupLocation?: string;
      returnLocation?: string;
      notes?: string;
    },
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
    });
    if (!vehicle) throw new NotFoundException('Xe không tồn tại');
    if ((vehicle as unknown as { status?: string })?.status !== 'VERIFIED') {
      throw new BadRequestException('Xe chưa được duyệt, không thể đặt');
    }
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      throw new BadRequestException('Thời gian không hợp lệ');
    }
    const totalDays = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const dailyRate = vehicle.dailyRate as unknown as number;
    const subtotal = (Number(dailyRate) || 0) * totalDays;
    const serviceFee = Math.round(subtotal * 0.1 * 100) / 100;
    const totalAmount = subtotal + serviceFee;
    return this.prisma.rental.create({
      data: {
        renter: { connect: { id: renterId } },
        owner: { connect: { id: vehicle.ownerId } },
        vehicle: { connect: { id: vehicle.id } },
        startDate,
        endDate,
        totalDays,
        dailyRate: vehicle.dailyRate,
        hourlyRate: vehicle.hourlyRate,
        subtotal,
        serviceFee,
        totalAmount,
        depositAmount: vehicle.depositAmount,
        pickupLocation: input.pickupLocation,
        returnLocation: input.returnLocation,
        notes: input.notes,
        status: RentalStatus.PENDING,
      },
    });
  }

  async ownerConfirm(ownerId: string, rentalId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id: rentalId, ownerId },
    });
    if (!rental) throw new NotFoundException('Không tìm thấy đơn');
    return this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.CONFIRMED,
      } as unknown as Prisma.RentalUpdateInput,
    });
  }

  async setActive(ownerId: string, rentalId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id: rentalId, ownerId },
    });
    if (!rental) throw new NotFoundException('Không tìm thấy đơn');
    return this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.ACTIVE,
      } as unknown as Prisma.RentalUpdateInput,
    });
  }

  async complete(ownerId: string, rentalId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id: rentalId, ownerId },
    });
    if (!rental) throw new NotFoundException('Không tìm thấy đơn');
    return this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.COMPLETED,
      } as unknown as Prisma.RentalUpdateInput,
    });
  }

  async cancelByRenter(renterId: string, rentalId: string) {
    const rental = await this.prisma.rental.findFirst({
      where: { id: rentalId, renterId },
    });
    if (!rental) throw new NotFoundException('Không tìm thấy đơn');
    return this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.CANCELLED,
      } as unknown as Prisma.RentalUpdateInput,
    });
  }
}
