# @rental-app/shared-prisma

Shared Prisma module cho các microservices trong rental app.

## Cài đặt

```bash
# Trong từng service
pnpm add @rental-app/shared-prisma
```

## Sử dụng

### 1. Import module trong AppModule

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "@rental-app/shared-prisma";

@Module({
  imports: [
    PrismaModule.forRoot({
      databaseUrl: process.env.DATABASE_URL,
      logLevel: ["query", "info", "warn", "error"],
      isGlobal: true, // Optional, default true
    }),
  ],
})
export class AppModule {}
```

### 2. Sử dụng trong Service

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@rental-app/shared-prisma";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createUser(userData: any) {
    return await this.prisma.client.user.create({
      data: userData,
    });
  }

  async findUserByEmail(email: string) {
    return await this.prisma.client.user.findUnique({
      where: { email },
    });
  }
}
```

### 3. Sử dụng Transaction

```typescript
async createBookingWithPayment(bookingData: any, paymentData: any) {
  return await this.prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: bookingData,
    });

    const payment = await tx.payment.create({
      data: {
        ...paymentData,
        bookingId: booking.id,
      },
    });

    return { booking, payment };
  });
}
```

### 4. Async Configuration

```typescript
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    PrismaModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        databaseUrl: configService.get("DATABASE_URL"),
        logLevel: ["query", "info", "warn", "error"],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Lợi ích

- ✅ Dùng chung cho nhiều service
- ✅ Config database URL linh hoạt
- ✅ Hỗ trợ transaction
- ✅ Type-safe với TypeScript
- ✅ Global module - không cần import ở mọi nơi
- ✅ Async configuration support
