# Rental App - Full Stack Application

Ứng dụng cho thuê nhà với backend NestJS và mobile app React Native/Expo.

## Cấu trúc dự án

```
rental-app/
├── backend/              # NestJS API Server
├── mobile/               # React Native/Expo Mobile App
├── package.json          # Root package với scripts quản lý
└── pnpm-workspace.yaml   # PNPM workspace configuration
```

## Cài đặt và chạy

### 1. Cài đặt tất cả dependencies

```bash
# Cài đặt dependencies cho cả backend và mobile
pnpm run install:all

# Hoặc cài đặt riêng lẻ
pnpm run install:backend
pnpm run install:mobile
```

### 2. Chạy ứng dụng

```bash
# Chạy cả backend và mobile đồng thời
pnpm start

# Hoặc chạy riêng lẻ
pnpm run start:backend    # Chạy backend (NestJS)
pnpm run start:mobile     # Chạy mobile (Expo)
```

### 3. Chạy mobile trên các platform khác nhau

```bash
pnpm run start:mobile:android    # Chạy trên Android
pnpm run start:mobile:ios        # Chạy trên iOS
pnpm run start:mobile:web        # Chạy trên Web
```

## Scripts có sẵn

### Cài đặt

- `pnpm run install:all` - Cài đặt dependencies cho cả backend và mobile
- `pnpm run install:backend` - Cài đặt dependencies cho backend
- `pnpm run install:mobile` - Cài đặt dependencies cho mobile

### Chạy ứng dụng

- `pnpm start` hoặc `pnpm run start:dev` - Chạy cả backend và mobile
- `pnpm run start:backend` - Chạy backend development server
- `pnpm run start:mobile` - Chạy mobile development server
- `pnpm run start:mobile:android` - Chạy mobile trên Android
- `pnpm run start:mobile:ios` - Chạy mobile trên iOS
- `pnpm run start:mobile:web` - Chạy mobile trên Web

### Build và Test

- `pnpm run build` - Build backend
- `pnpm run build:backend` - Build backend
- `pnpm run test` - Chạy tests cho backend
- `pnpm run test:backend` - Chạy tests cho backend

### Lint và Clean

- `pnpm run lint` - Lint cả backend và mobile
- `pnpm run lint:backend` - Lint backend
- `pnpm run lint:mobile` - Lint mobile
- `pnpm run clean` - Xóa node_modules và build files
- `pnpm run clean:backend` - Xóa node_modules và dist của backend
- `pnpm run clean:mobile` - Xóa node_modules và .expo của mobile

## Yêu cầu hệ thống

- Node.js >= 18
- pnpm (khuyến nghị) hoặc npm
- Expo CLI (cho mobile development)
- Android Studio (cho Android development)
- Xcode (cho iOS development trên macOS)

## Phát triển

1. **Backend**: NestJS API server chạy trên port mặc định (thường là 3000)
2. **Mobile**: Expo development server với Metro bundler

Để phát triển, chạy `pnpm start` để khởi động cả hai services đồng thời.
