# Refresh Token Implementation

## Tổng quan

Hệ thống đã được tích hợp sẵn sàng cho refresh token. Khi backend implement refresh token endpoint, app sẽ tự động sử dụng.

## Cách hoạt động

### 1. Flow đăng nhập

Khi user đăng nhập thành công:

```typescript
// Backend response có thể có:
{
  user: {...},
  accessToken: "...",
  refreshToken: "..." // Optional, chưa có trong backend hiện tại
}

// Mobile sẽ lưu cả 2 token
login(user, { accessToken, refreshToken });
```

### 2. Tự động refresh token

Khi API trả về lỗi 401 (Unauthorized):

- App sẽ tự động gọi `POST /auth/refresh` với refresh token
- Cập nhật access token mới
- Retry lại request ban đầu
- Nếu refresh thất bại → logout và redirect về login

### 3. Cấu trúc code

#### Auth Store (`mobile/store/auth.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null; // Access token
  refreshToken: string | null; // Refresh token
  isAuthenticated: boolean;
  login: (user, tokens) => void;
  updateTokens: (tokens) => void; // Update chỉ token
}
```

#### API Interceptor (`mobile/lib/api.ts`)

```typescript
// Tự động intercept 401 errors và refresh token
if (status === 401 && !originalRequest._retry) {
  const tokens = await authApi.refreshToken(refreshToken);
  // Update tokens và retry request
}
```

#### Auth API Service (`mobile/lib/api.auth.ts`)

```typescript
async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  // POST /auth/refresh
  // Trả về { accessToken, refreshToken }
}
```

## Backend cần implement

Để hoàn chỉnh refresh token flow, backend cần thêm:

### 1. Refresh Token Endpoint

```typescript
// backend/src/modules/auth/auth.controller.ts

@Post('refresh')
@ApiOperation({ summary: 'Refresh access token' })
async refreshToken(@Body() body: { refreshToken: string }) {
  return this.authService.refreshToken(body.refreshToken);
}
```

### 2. Update Auth Service

```typescript
// backend/src/modules/auth/auth.service.ts

async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  // Verify refresh token
  // Generate new access token
  // Return { accessToken, refreshToken }
}
```

### 3. Update Auth Response

```typescript
export interface AuthResponse {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string; // Thêm vào
}
```

## Testing

### Test với Expo Go:

1. Đăng nhập thành công
2. Chờ token hết hạn (hoặc invalidate token trên backend)
3. Gọi một API protected
4. App sẽ tự động refresh token và retry

### Kiểm tra logs:

```bash
# Xem logs của app
npx expo start
```

## Lưu ý

- Refresh token được lưu trong AsyncStorage với Zustand persist
- Access token được cache trong memory để tránh gọi AsyncStorage mỗi request
- Khi token hết hạn, app tự động logout nếu refresh thất bại
- Backend hiện tại chưa có refresh token endpoint, app sẽ tự động sử dụng khi backend có

## Security

- Access token: Ngắn hạn (7 ngày)
- Refresh token: Dài hạn (30 ngày)
- Refresh token chỉ dùng một lần
- Tự động cleanup khi logout
