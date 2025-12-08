import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CityService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaultCities();
  }

  // Seed basic cities if missing
  private async ensureDefaultCities() {
    const defaultCities = [
      { name: 'Thành phố Hồ Chí Minh', province: 'Hồ Chí Minh' },
      { name: 'Hà Nội', province: 'Hà Nội' },
    ];
    for (const c of defaultCities) {
      const existing = await this.prisma.city
        .findUnique({
          where: {
            name_province: { name: c.name, province: c.province },
          },
        })
        .catch(() => null);
      if (!existing) {
        try {
          await this.prisma.city.create({
            data: { name: c.name, province: c.province, isActive: true },
          });
        } catch (e) {
          // ignore race
          console.error('❌ Error seeding cities:', e);
          process.exit(1);
        }
      }
    }
  }

  async findAll() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
