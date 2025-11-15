# Tạo Admin User

## Cách sử dụng

### Tạo admin với email và password mặc định:
```bash
pnpm create-admin
```
Sẽ tạo admin với:
- Email: `admin@rentalapp.com`
- Password: `admin123456`

### Tạo admin với email và password tùy chỉnh:
```bash
pnpm create-admin <email> <password>
```

Ví dụ:
```bash
pnpm create-admin admin@example.com MySecurePassword123
```

## Lưu ý

- Script sẽ kiểm tra xem email đã tồn tại chưa
- Admin user sẽ được tạo với:
  - Role: `ADMIN`
  - `isActive`: `true`
  - `isVerified`: `true` (không cần verify email)
  - `isPhoneVerified`: `false`

## Đăng nhập

Sau khi tạo admin, bạn có thể đăng nhập vào:
- Web admin: `/admin/login`
- API: `POST /api/auth/login`

Với email và password đã tạo.

