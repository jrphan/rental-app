# Auth Service - Shared Prisma Integration

## Cấu hình hoàn thành ✅

Auth service đã được cấu hình để sử dụng `@rental-app/shared-prisma` package.

### Thay đổi đã thực hiện:

1. **package.json**: Thêm dependency `@rental-app/shared-prisma`
2. **app.module.ts**: Import và config PrismaModule
3. **auth.module.ts**: Loại bỏ import PrismaModule cũ
4. **auth.service.ts**: Cập nhật import và sử dụng `this.prisma.client`

### Cách sử dụng:

```typescript
// Trong AuthService
constructor(private prisma: PrismaService) {}

// Sử dụng database
const user = await this.prisma.client.user.findUnique({
  where: { email: 'user@example.com' }
});

// Transaction
await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const token = await tx.refreshToken.create({ data: tokenData });
  return { user, token };
});
```

### Lợi ích:

- ✅ Dùng chung PrismaModule với các services khác
- ✅ Config database URL tập trung
- ✅ Type-safe với TypeScript
- ✅ Hỗ trợ transaction
- ✅ Global module - không cần import ở mọi nơi

### Các service khác có thể áp dụng tương tự:

```bash
# Vehicle Service
cd apps/vehicle-service
# Thêm @rental-app/shared-prisma vào package.json
# Config trong app.module.ts với database URL riêng

# Booking Service
cd apps/booking-service
# Tương tự...
```
