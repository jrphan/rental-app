# Prisma Database Setup Guide

Hướng dẫn setup database với Prisma cho từng service trong rental app.

## Tổng quan

Mỗi service có database riêng biệt với Prisma schema riêng:

- **Auth Service**: PostgreSQL (port 5432) - Quản lý users, authentication
- **Vehicle Service**: PostgreSQL (port 5433) - Quản lý vehicles, maintenance
- **Booking Service**: PostgreSQL (port 5434) - Quản lý bookings, payments
- **Payment Service**: PostgreSQL (port 5435) - Quản lý payments, transactions
- **Review Service**: PostgreSQL (port 5436) - Quản lý reviews, ratings
- **Shared**: Redis (port 6379, 6380), MongoDB (port 27017-27019), MinIO (port 9000)

## Cài đặt

### 1. Cài đặt dependencies

```bash
# Cài đặt Prisma cho từng service
cd apps/auth-service
pnpm add prisma @prisma/client

cd ../vehicle-service
pnpm add prisma @prisma/client

cd ../booking-service
pnpm add prisma @prisma/client

cd ../payment-service
pnpm add prisma @prisma/client

cd ../review-service
pnpm add prisma @prisma/client
```

### 2. Khởi động databases

```bash
# Khởi động tất cả databases
docker-compose -f docker-compose.databases.yml up -d

# Kiểm tra status
docker-compose -f docker-compose.databases.yml ps
```

### 3. Setup environment

```bash
# Copy file environment
cp env.prisma.example .env

# Hoặc tạo .env cho từng service
# apps/auth-service/.env
DATABASE_URL="postgresql://auth_user:auth_password_123@localhost:5432/rental_auth?schema=public"

# apps/vehicle-service/.env
DATABASE_URL="postgresql://vehicle_user:vehicle_password_123@localhost:5433/rental_vehicle?schema=public"
```

### 4. Chạy Prisma migrations

```bash
# Auth Service
cd apps/auth-service
npx prisma generate
npx prisma db push

# Vehicle Service
cd ../vehicle-service
npx prisma generate
npx prisma db push

# Booking Service
cd ../booking-service
npx prisma generate
npx prisma db push

# Payment Service
cd ../payment-service
npx prisma generate
npx prisma db push

# Review Service
cd ../review-service
npx prisma generate
npx prisma db push
```

## Sử dụng trong Code

### 1. Khởi tạo Prisma Client

```typescript
// apps/auth-service/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 2. Sử dụng trong Service

```typescript
// apps/auth-service/src/app/auth/auth.service.ts
import { Injectable } from "@nestjs/common";
import { prisma } from "../../lib/prisma";

@Injectable()
export class AuthService {
  async createUser(userData: any) {
    return await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        // Không select password
      },
    });
  }

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        verificationTokens: true,
        refreshTokens: true,
      },
    });
  }
}
```

### 3. Transaction Example

```typescript
// apps/booking-service/src/app/booking/booking.service.ts
import { Injectable } from "@nestjs/common";
import { prisma } from "../../lib/prisma";

@Injectable()
export class BookingService {
  async createBooking(bookingData: any) {
    return await prisma.$transaction(async (tx) => {
      // Tạo booking
      const booking = await tx.booking.create({
        data: bookingData,
      });

      // Tạo payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          // ... other payment data
        },
      });

      // Update vehicle status
      await tx.vehicle.update({
        where: { id: bookingData.vehicleId },
        data: { status: "RENTED" },
      });

      return { booking, payment };
    });
  }
}
```

## Database Schema

### Auth Service (Port 5432)

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  firstName         String    @map("first_name")
  lastName          String    @map("last_name")
  role              UserRole  @default(USER)
  // ... other fields
}
```

### Vehicle Service (Port 5433)

```prisma
model Vehicle {
  id              String        @id @default(cuid())
  ownerId         String        @map("owner_id")
  make            String
  model           String
  year            Int
  pricePerDay     Decimal       @map("price_per_day")
  status          VehicleStatus @default(AVAILABLE)
  // ... other fields
}
```

### Booking Service (Port 5434)

```prisma
model Booking {
  id              String        @id @default(cuid())
  userId          String        @map("user_id")
  vehicleId       String        @map("vehicle_id")
  startDate       DateTime      @map("start_date")
  endDate         DateTime      @map("end_date")
  totalAmount     Decimal       @map("total_amount")
  status          BookingStatus @default(PENDING)
  // ... other fields
}
```

## Quản lý Database

### 1. Prisma Studio

```bash
# Mở Prisma Studio cho từng service
cd apps/auth-service
npx prisma studio

cd ../vehicle-service
npx prisma studio
```

### 2. Database Migrations

```bash
# Tạo migration
npx prisma migrate dev --name init

# Reset database
npx prisma migrate reset

# Deploy migrations
npx prisma migrate deploy
```

### 3. Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed users
  await prisma.user.create({
    data: {
      email: "admin@rental.com",
      passwordHash: "$2b$10$...", // hashed password
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isVerified: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Deployment trên EC2

### 1. Setup EC2

```bash
# Chạy script setup
chmod +x scripts/setup-ec2.sh
./scripts/setup-ec2.sh
```

### 2. Deploy Application

```bash
# Deploy với environment variables
EC2_HOST=your-ec2-ip EC2_KEY=~/.ssh/your-key.pem ./scripts/deploy-to-ec2.sh
```

### 3. Monitor Services

```bash
# SSH vào EC2 và chạy monitor
ssh -i ~/.ssh/your-key.pem ubuntu@your-ec2-ip
cd /opt/rental-app
./monitor-databases.sh
```

## Backup và Restore

### 1. Backup

```bash
# Backup tất cả databases
./backup-databases.sh
```

### 2. Restore

```bash
# Restore từ backup
tar -xzf backup_20240101_120000.tar.gz
# Import vào từng database
```

## Troubleshooting

### 1. Connection Issues

```bash
# Kiểm tra database connection
docker exec rental-postgres-auth pg_isready -U auth_user -d rental_auth

# Kiểm tra logs
docker logs rental-postgres-auth
```

### 2. Prisma Issues

```bash
# Reset Prisma client
rm -rf node_modules/.prisma
npx prisma generate

# Reset database
npx prisma migrate reset
```

### 3. Performance Issues

```sql
-- Kiểm tra slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Security Best Practices

1. **Environment Variables**: Không commit passwords vào code
2. **Database Access**: Chỉ expose ports cần thiết
3. **Backup Encryption**: Encrypt backups trước khi store
4. **Connection Pooling**: Sử dụng connection pooling
5. **Audit Logging**: Log tất cả database operations

## Monitoring

### 1. Database Metrics

- Connection count
- Query performance
- Disk usage
- Memory usage

### 2. Application Metrics

- Response times
- Error rates
- Throughput

### 3. Alerting

- Database down
- High CPU usage
- Disk space low
- Connection pool exhausted
