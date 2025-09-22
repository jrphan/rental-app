# 🚗 Rental App Workspace

Workspace phát triển ứng dụng cho thuê xe với kiến trúc microservices sử dụng Nx, React Native và NestJS.

## 📁 Cấu trúc Workspace

```
rental-app/
├── apps/                           # Các ứng dụng
│   ├── rental-mobile/              # React Native + Expo (Mobile App)
│   ├── api-gateway/                # NestJS API Gateway (Entry Point)
│   ├── auth-service/               # NestJS Auth Microservice
│   ├── vehicle-service/            # NestJS Vehicle Microservice
│   └── booking-service/            # NestJS Booking Microservice
├── packages/                       # Shared libraries
│   ├── shared-types/               # Shared TypeScript types
│   └── shared-utils/               # Shared utilities
└── README.md
```

## 🚀 Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd rental-app

# Cài đặt dependencies
pnpm install
```

## 📱 Chạy Ứng dụng

### Mobile App (React Native + Expo)

```bash
# Start Expo dev server
pnpm mobile

# Chạy trên iOS simulator
pnpm mobile:ios

# Chạy trên Android emulator
pnpm mobile:android

# Chạy web version
pnpm mobile:web
```

### Backend Services (NestJS)

```bash
# Start API Gateway (recommended - single entry point)
pnpm gateway    # API Gateway (port 3000)

# Start từng service riêng lẻ
pnpm auth       # Auth service (port 3333)
pnpm vehicle    # Vehicle service (port 3334)
pnpm booking    # Booking service (port 3335)

# Start tất cả backend services bao gồm gateway
pnpm dev:backend

# Start chỉ microservices (không bao gồm gateway)
pnpm dev:services
```

## 🛠️ Development

### Thêm App Mới

#### React Native App:

```bash
pnpx nx g @nx/expo:app --name=new-app --directory=apps/new-app --routing
```

#### NestJS Microservice:

```bash
pnpx nx g @nx/nest:app --name=new-service --directory=apps/new-service
```

#### Angular App:

```bash
pnpx nx g @nx/angular:app --name=new-angular-app --directory=apps/new-angular-app
```

#### Next.js App:

```bash
pnpx nx g @nx/next:app --name=new-next-app --directory=apps/new-next-app
```

### Thêm Library Mới

#### JavaScript/TypeScript Library:

```bash
pnpx nx g @nx/js:lib --name=new-lib --directory=packages/new-lib
```

#### React Library:

```bash
pnpx nx g @nx/react:lib --name=ui-components --directory=packages/ui-components
```

### Quản lý Dependencies

#### Thêm dependency cho toàn workspace:

```bash
pnpm add <package-name>
```

#### Thêm dependency cho app cụ thể:

```bash
cd apps/rental-mobile && pnpm add <package-name>
# hoặc
pnpm add <package-name> --filter apps/rental-mobile
```

#### Thêm dev dependency:

```bash
pnpm add -D <package-name>
```

## 🏗️ Build & Deploy

### Build tất cả projects:

```bash
pnpm build:all
```

### Build project cụ thể:

```bash
pnpx nx build rental-mobile
pnpx nx build auth-service
```

### Export mobile app:

```bash
pnpx nx export rental-mobile
```

## 🧪 Testing

### Test tất cả:

```bash
pnpm test:all
```

### Test project cụ thể:

```bash
pnpx nx test rental-mobile
pnpx nx test auth-service
```

### E2E Testing:

```bash
pnpx nx e2e auth-service-e2e
pnpx nx e2e vehicle-service-e2e
```

## 📊 Workspace Utilities

### Xem tất cả projects:

```bash
pnpx nx show projects
```

### Xem chi tiết project:

```bash
pnpx nx show project rental-mobile
pnpx nx show project auth-service
```

### Xem dependency graph:

```bash
pnpx nx graph
```

### Lint toàn bộ workspace:

```bash
pnpx nx run-many --target=lint --all
```

### Format code:

```bash
pnpx nx format:write
```

## 🔧 Cấu hình

### Package Manager: pnpm

- Workspace được cấu hình với `pnpm-workspace.yaml`
- Sử dụng pnpm cho tất cả package management

### TypeScript:

- Shared configuration trong `tsconfig.base.json`
- Mỗi app/library có tsconfig riêng

### Nx Configuration:

- Plugin `@nx/expo` cho React Native
- Plugin `@nx/nest` cho NestJS
- Plugin `@nx/js` cho JavaScript/TypeScript libraries

## 📚 Tech Stack

### Frontend:

- **React Native** - Mobile app framework
- **Expo** - Development platform và build tools
- **Expo Router** - File-based routing

### Backend:

- **NestJS** - Node.js framework cho microservices
- **Express** - Web server
- **TypeScript** - Type-safe JavaScript

### Tools:

- **Nx** - Monorepo management
- **pnpm** - Package manager
- **Webpack** - Bundler cho backend
- **Metro** - Bundler cho React Native

## 🌐 Ports & API Endpoints

- **API Gateway**: http://localhost:3000/api (Entry Point)
- **Mobile App**: Expo dev server (default: 8081)
- **Auth Service**: http://localhost:3333/api
- **Vehicle Service**: http://localhost:3334/api
- **Booking Service**: http://localhost:3335/api

### API Gateway Routes:

- **Health Check**: `GET /api/health`
- **Auth**: `* /api/auth/*` → Auth Service
- **Vehicles**: `* /api/vehicles/*` → Vehicle Service
- **Bookings**: `* /api/bookings/*` → Booking Service

## 📝 Scripts Có Sẵn

| Script                | Mô tả                           |
| --------------------- | ------------------------------- |
| `pnpm mobile`         | Start mobile app                |
| `pnpm mobile:ios`     | Chạy iOS simulator              |
| `pnpm mobile:android` | Chạy Android emulator           |
| `pnpm gateway`        | Start API Gateway (port 3000)   |
| `pnpm auth`           | Start auth service              |
| `pnpm vehicle`        | Start vehicle service           |
| `pnpm booking`        | Start booking service           |
| `pnpm dev:backend`    | Start gateway + tất cả services |
| `pnpm dev:services`   | Start chỉ microservices         |
| `pnpm build:all`      | Build tất cả projects           |
| `pnpm test:all`       | Test tất cả projects            |

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

[MIT](LICENSE)
