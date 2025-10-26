# Authentication API Documentation

## Tổng quan

API đăng ký và đăng nhập cho ứng dụng thuê xe máy P2P với 3 loại người dùng:

- **RENTER**: Người thuê xe
- **OWNER**: Người cho thuê xe
- **ADMIN**: Quản trị viên

## Endpoints

### 1. Đăng ký (Register)

**POST** `/api/auth/register`

Tạo tài khoản mới với email và password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "phone": "0123456789",
  "role": "RENTER"
}
```

**Validation:**

- Email phải hợp lệ và chưa tồn tại
- Password phải có ít nhất 8 ký tự, chứa chữ hoa, chữ thường, số và ký tự đặc biệt
- Phone (optional) phải có 10-11 số và chưa tồn tại
- Role mặc định là RENTER

**Response (201):**

```json
{
  "success": true,
  "message": "Tạo thành công",
  "data": {
    "user": {
      "id": "clxxxxx",
      "email": "user@example.com",
      "phone": "0123456789",
      "role": "RENTER",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400`: Dữ liệu đầu vào không hợp lệ
- `409`: Email hoặc số điện thoại đã tồn tại

---

### 2. Đăng nhập (Login)

**POST** `/api/auth/login`

Đăng nhập với email và password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**

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
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `401`: Email hoặc mật khẩu không đúng
- `401`: Tài khoản đã bị vô hiệu hóa

---

### 3. Lấy thông tin người dùng hiện tại

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "id": "clxxxxx",
    "email": "user@example.com",
    "phone": "0123456789",
    "role": "RENTER",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

- `401`: Unauthorized - Token không hợp lệ hoặc đã hết hạn

---

### 4. Đổi mật khẩu

**PUT** `/api/auth/change-password`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật thành công",
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

**Error Responses:**

- `401`: Mật khẩu cũ không đúng

---

## JWT Token

- **Expiration**: 7 ngày
- **Algorithm**: HS256
- **Payload**: `{ sub: userId, email, role }`

## Bảo mật

1. Passwords được hash bằng bcrypt với salt rounds = 10
2. JWT token được yêu cầu cho các endpoints được bảo vệ
3. Token được gửi qua header: `Authorization: Bearer <token>`

## Vai trò người dùng

- **RENTER**: Người thuê xe (mặc định)
- **OWNER**: Người cho thuê xe
- **ADMIN**: Quản trị viên

## Environment Variables

Thêm vào file `.env`:

```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=7d
```

## Testing

API documentation có sẵn tại Swagger UI:

```
http://localhost:3000/api/docs
```
