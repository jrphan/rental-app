# Format Response API - Đồng bộ Backend, Web và Mobile

## Tổng quan

Tài liệu này mô tả format response API đã được đồng bộ giữa Backend (NestJS), Web (Angular) và Mobile (React Native).

## Cấu trúc Response

### Format chuẩn từ Backend

Backend tự động wrap tất cả response thành format sau:

```typescript
interface ApiResponse<T> {
  success: boolean; // true nếu thành công, false nếu có lỗi
  message: string; // Thông báo mô tả kết quả
  data?: T; // Dữ liệu thực tế
  error?: string; // Thông báo lỗi (nếu có)
  timestamp: string; // ISO timestamp
  path: string; // Đường dẫn API được gọi
  statusCode: number; // HTTP status code
}
```

### Ví dụ

**Response thành công:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "clxxxxx",
      "email": "user@example.com",
      "phone": "0123456789",
      "role": "RENTER",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login",
  "statusCode": 200
}
```

**Response lỗi:**

```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng",
  "error": "UnauthorizedException",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login",
  "statusCode": 401
}
```

## Xử lý Response ở Frontend

### Web (Angular)

**1. Interceptor tự động unwrap response:**

File: `web/src/interceptors/response.interceptor.ts`

```typescript
// Tự động extract data từ response.data
// Service sẽ nhận được data trực tiếp thay vì toàn bộ wrapper
```

**2. AuthService sử dụng:**

```typescript
// Service nhận trực tiếp AuthResponse
login(credentials: LoginRequest): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.apiUrl}/auth/login`,
    credentials
  ).pipe(
    tap((response) => {
      this.saveTokens(response.accessToken, response.refreshToken);
      this.saveUser(response.user);
    })
  );
}
```

### Mobile (React Native)

**1. Interceptor xử lý response:**

File: `mobile/lib/api.ts`

```typescript
// Interceptor tự động extract data từ response
// apiClient trả về response.data
```

**2. AuthService sử dụng:**

File: `mobile/lib/api.auth.ts`

```typescript
// apiClient tự động extract data từ ApiResponse<T>
async login(data: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", data);
  if (response.success && response.data && !Array.isArray(response.data)) {
    return response.data; // Đã được unwrap
  }
  throw new Error(response.message || "Đăng nhập thất bại");
}
```

## Các Interface Types

### Backend

File: `backend/src/common/interfaces/Response/response.interface.ts`

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}
```

### Web

File: `web/src/interceptors/response.interceptor.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}
```

### Mobile

File: `mobile/types/response.types.ts`

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  path: string;
  statusCode: number;
}
```

## Các Endpoint Authentication

### 1. Login

**Backend Response:**

```typescript
// auth.service.ts
return {
  user: userWithoutPassword,
  accessToken,
  refreshToken,
};
```

**Wrapped by ResponseInterceptor:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  },
  ...
}
```

### 2. Register

**Backend Response:**

```typescript
// auth.service.ts
return {
  userId: user.id,
  email: user.email,
  message:
    "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực.",
};
```

**Wrapped by ResponseInterceptor:**

```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "userId": "clxxxxx",
    "email": "user@example.com",
    "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác thực."
  },
  ...
}
```

### 3. Verify OTP

**Backend Response:**

```typescript
return {
  user: user,
  accessToken,
  refreshToken,
};
```

### 4. Reset Password

**Backend Response:**

```typescript
return {
  user: user,
  accessToken,
  refreshToken,
};
```

## Error Handling

Backend sử dụng `HttpExceptionFilter` để format error responses:

```typescript
// backend/src/common/filters/http-exception.filter.ts
{
  success: false,
  message: "Email hoặc mật khẩu không đúng",
  error: "UnauthorizedException",
  timestamp: "...",
  path: "...",
  statusCode: 401,
  // Có thể có thêm metadata như requiresVerification, userId, email
}
```

## Implementation Details

### Backend (NestJS)

**Global Response Interceptor:**

- File: `backend/src/common/interceptors/response.interceptor.ts`
- Được áp dụng global trong `backend/src/main.ts`
- Tự động wrap tất cả successful responses

**Special Cases:**

- DELETE requests không có data → trả về success message
- Response đã được wrap → giữ nguyên
- Có metadata từ exceptions (userId, email, requiresVerification)

### Web (Angular)

**HTTP Interceptor:**

- File: `web/src/interceptors/response.interceptor.ts`
- Được register trong `web/src/app/app.config.ts`
- Tự động unwrap response.data

**Services:**

- AuthService nhận trực tiếp data type
- Không cần phải xử lý wrapper

### Mobile (React Native)

**Axios Interceptor:**

- File: `mobile/lib/api.ts`
- Tự động extract data từ response
- Xử lý error responses đồng nhất

**API Client:**

- File: `mobile/lib/apiClient.ts`
- Trả về `ApiResponse<T>` nhưng services extract data
- Xử lý authentication và refresh token tự động

## Notes

1. **Backend luôn wrap response** - ResponseInterceptor là global
2. **Web tự động unwrap** - Services nhận data trực tiếp
3. **Mobile tự động extract** - apiClient trả về data từ response.data
4. **Format đồng bộ** - Cả 3 platforms sử dụng cùng cấu trúc ApiResponse
5. **Error handling nhất quán** - HttpExceptionFilter format lỗi đồng nhất

## Testing

Để verify format response:

1. **Backend:** Check Swagger docs tại `/api/docs`
2. **Web:** Check Network tab trong DevTools
3. **Mobile:** Check response trong debug logs

## Tài liệu tham khảo

- Backend API Docs: `backend/AUTH_API.md`
- Mobile Auth Docs: `mobile/AUTH_REFRESH_TOKEN.md`
