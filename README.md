# Rental App - Simple Backend

Ứng dụng thuê xe máy với backend NestJS đơn giản và PostgreSQL.

## 🏗️ Kiến trúc

- **Backend**: NestJS với Prisma ORM
- **Database**: PostgreSQL
- **Mobile**: React Native với Expo
- **Authentication**: JWT tokens

## 🚀 Cách chạy

### 1. Khởi động Database

```bash
# Khởi động PostgreSQL
docker-compose -f docker-compose.simple.yml up -d
```

### 2. Setup Backend

```bash
# Cài đặt dependencies
pnpm install

# Setup Prisma
npm run db:setup

# Chạy backend
npm run backend
```

### 3. Chạy Mobile App

```bash
# Chạy mobile app
npm run mobile

# Chạy trên iOS
npm run mobile:ios

# Chạy trên Android
npm run mobile:android

# Chạy trên Web
npm run mobile:web
```

## 📊 API Endpoints

### Auth

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Thông tin profile

### Vehicles

- `GET /api/vehicles` - Danh sách xe
- `POST /api/vehicles` - Tạo xe mới
- `GET /api/vehicles/:id` - Chi tiết xe
- `PUT /api/vehicles/:id` - Cập nhật xe
- `DELETE /api/vehicles/:id` - Xóa xe

### Bookings

- `GET /api/bookings` - Danh sách booking
- `POST /api/bookings` - Tạo booking
- `GET /api/bookings/:id` - Chi tiết booking
- `PUT /api/bookings/:id` - Cập nhật booking
- `DELETE /api/bookings/:id` - Hủy booking

### Payments

- `GET /api/payments` - Danh sách payment
- `POST /api/payments` - Tạo payment
- `GET /api/payments/:id` - Chi tiết payment

## 🔧 Scripts

- `npm run backend` - Chạy backend
- `npm run mobile` - Chạy mobile app
- `npm run mobile:ios` - Chạy trên iOS
- `npm run mobile:android` - Chạy trên Android
- `npm run mobile:web` - Chạy trên Web
- `npm run build` - Build backend
- `npm run build:all` - Build tất cả
- `npm run db:setup` - Setup database
- `npm run prisma:studio` - Mở Prisma Studio

## 📁 Cấu trúc thư mục

```
rental-app/
├── apps/
│   ├── backend/          # NestJS Backend
│   └── rental-mobile/    # React Native Mobile App
├── packages/
│   ├── shared-types/    # Shared TypeScript types
│   └── shared-utils/    # Shared utility functions
└── docker-compose.simple.yml
```

## 🗄️ Database Schema

- **Users**: Thông tin người dùng
- **Vehicles**: Thông tin xe máy
- **Bookings**: Đặt xe
- **Payments**: Thanh toán

## 🔐 Authentication

Sử dụng JWT tokens cho authentication. Gửi token trong header:

```
Authorization: Bearer <your-jwt-token>
```
