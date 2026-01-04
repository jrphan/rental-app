# Rental App - Full Stack Application

Ứng dụng cho thuê xe P2P với backend NestJS, mobile app React Native/Expo và web admin.

## Cấu trúc dự án

```
rental-app/
├── backend/              # NestJS API Server
├── mobile/               # React Native/Expo Mobile App
├── web/                  # React Web Admin Dashboard
├── package.json          # Root package với scripts quản lý
└── pnpm-workspace.yaml   # PNPM workspace configuration
```

## Cài đặt và chạy

### 1. Cài đặt tất cả dependencies

```bash
# Cài đặt dependencies cho cả backend, mobile và web
pnpm run install:all

# Hoặc cài đặt riêng lẻ
pnpm run install:backend
pnpm run install:mobile
pnpm run install:web
```

### 2. Chạy ứng dụng

```bash
pnpm run start:backend    # Chạy backend (NestJS)
pnpm run start:mobile     # Chạy mobile (Expo)
pnpm run start:web        # Chạy web admin
```

### 3. Chạy mobile trên các platform khác nhau

```bash
pnpm run start:mobile:android    # Chạy trên Android
pnpm run start:mobile:ios        # Chạy trên iOS
pnpm run start:mobile:web        # Chạy trên Web
```

## Scripts có sẵn

### Cài đặt

- `pnpm run install:all` - Cài đặt dependencies cho cả backend, mobile và web
- `pnpm run install:backend` - Cài đặt dependencies cho backend
- `pnpm run install:mobile` - Cài đặt dependencies cho mobile
- `pnpm run install:web` - Cài đặt dependencies cho web

### Chạy ứng dụng

- `pnpm run start:backend` - Chạy backend development server
- `pnpm run start:mobile` - Chạy mobile development server
- `pnpm run start:mobile:android` - Chạy mobile trên Android
- `pnpm run start:mobile:ios` - Chạy mobile trên iOS
- `pnpm run start:mobile:web` - Chạy mobile trên Web
- `pnpm run start:web` - Chạy web admin dashboard

## Yêu cầu hệ thống

- Node.js >= 18
- pnpm (khuyến nghị) hoặc npm
- PostgreSQL database
- Expo CLI (cho mobile development)
- Android Studio (cho Android development)
- Xcode (cho iOS development trên macOS)

## Phát triển

1. **Backend**: NestJS API server chạy trên port mặc định (thường là 3000)
2. **Mobile**: Expo development server với Metro bundler
3. **Web**: React admin dashboard với Vite

Để phát triển, chạy `pnpm start` để khởi động cả backend và mobile đồng thời.

---

## Tài liệu luồng nghiệp vụ: Thuê xe P2P

Tài liệu này mô tả chi tiết luồng thao tác thực tế trong hệ thống cho thuê xe ngang hàng, từ góc nhìn Người thuê (Renter), Chủ xe (Vendor/Owner) và Quản trị (Admin). Bao gồm các điều kiện, trạng thái, kiểm duyệt và các điểm tích hợp UI/API chính.

### 1) Thuật ngữ chính

- **Renter (Người thuê)**: Người dùng thuê xe để sử dụng. Tất cả user mới mặc định là renter.
- **Vendor/Owner (Chủ xe)**: Người dùng cung cấp xe để cho thuê. Được xác định bởi flag `isVendor = true`. Tự động trở thành vendor khi có xe đầu tiên được duyệt.
- **Admin**: Quản trị hệ thống (role `ADMIN`), kiểm duyệt hồ sơ, xe, và xử lý khiếu nại.
- **Support**: Hỗ trợ khách hàng (role `SUPPORT`), có quyền duyệt xe và hỗ trợ người dùng.
- **KYC**: Xác thực danh tính người dùng (giấy tờ tuỳ thân, giấy phép lái xe, ảnh selfie).
- **Vehicle Verification**: Kiểm duyệt xe đăng tải trước khi được cho thuê.

### 2) Trạng thái và điều kiện quan trọng

#### UserRole

- `USER`: Người dùng thường (mặc định)
- `ADMIN`: Quản trị hệ thống
- `SUPPORT`: Hỗ trợ khách hàng

**Lưu ý**: Hệ thống không sử dụng role `RENTER` hay `OWNER`. Thay vào đó, sử dụng flag `isVendor` để phân biệt chủ xe.

#### VehicleStatus

- `DRAFT`: Chưa đủ thông tin, đang chỉnh sửa
- `PENDING`: Đã gửi duyệt, chờ admin/support xem xét
- `APPROVED`: Đã được duyệt, có thể cho thuê
- `REJECTED`: Bị từ chối, có thể chỉnh sửa và gửi lại
- `MAINTENANCE`: Đang bảo trì, tạm thời không cho thuê
- `HIDDEN`: Ẩn xe, không hiển thị trong tìm kiếm

**Lifecycle**: `DRAFT` → `PENDING` → `APPROVED` | `REJECTED` → (có thể `PENDING` lại)

#### RentalStatus

- `PENDING_PAYMENT`: Chờ thanh toán (sau khi tạo đơn)
- `AWAIT_APPROVAL`: Chờ chủ xe xác nhận
- `CONFIRMED`: Đã được xác nhận, chờ đến ngày thuê
- `ON_TRIP`: Đang trong quá trình thuê
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy
- `DISPUTED`: Có tranh chấp, cần admin xử lý

**Lifecycle**: `PENDING_PAYMENT` → `AWAIT_APPROVAL` → `CONFIRMED` → `ON_TRIP` → `COMPLETED`

#### KycStatus

- `PENDING`: Chờ duyệt
- `APPROVED`: Đã được duyệt
- `REJECTED`: Bị từ chối
- `NEEDS_UPDATE`: Cần cập nhật thông tin

### 3) Điều kiện để trở thành chủ xe (Vendor)

**Tự động trở thành vendor khi**:

1. Người dùng có KYC với status `APPROVED`
2. Người dùng đã xác thực số điện thoại (`isPhoneVerified = true`)
3. Người dùng có ít nhất 1 xe được admin/support duyệt (`status = APPROVED`)
4. Hệ thống tự động set `isVendor = true` khi xe đầu tiên được approve

**Không cần gửi "Owner Application" riêng** - quá trình này tự động.

### 4) Luồng Người dùng Renter (Người thuê)

1. **Đăng ký tài khoản**
   - Nhập số điện thoại → Nhận OTP → Xác thực OTP
   - Tạo mật khẩu → Hoàn tất đăng ký

2. **Xác thực và KYC** (khuyến nghị)
   - Xác thực số điện thoại (nếu chưa)
   - Hoàn thành KYC: upload CMND/CCCD, giấy phép lái xe, ảnh selfie
   - Chờ admin duyệt KYC (`APPROVED`)

3. **Tìm kiếm xe**
   - Lọc theo thành phố, thời gian, loại xe, giá
   - Xem danh sách xe (chỉ hiển thị xe `APPROVED`)
   - Xem chi tiết xe, hình ảnh, đánh giá

4. **Đặt xe (Booking)**
   - Chọn xe → Chọn thời gian thuê/trả
   - Chọn điểm nhận/trả xe (có thể giao tận nơi)
   - Chọn bảo hiểm (tùy chọn)
   - Áp dụng mã giảm giá (nếu có)
   - Thanh toán → Tạo `Rental` với status `PENDING_PAYMENT`
   - Sau khi thanh toán thành công → `AWAIT_APPROVAL`

5. **Chờ xác nhận**
   - Chủ xe nhận thông báo → Xác nhận hoặc từ chối
   - Nếu xác nhận → `CONFIRMED`
   - Nếu từ chối → `CANCELLED` (hoàn tiền)

6. **Thuê xe**
   - Đến ngày thuê → Chủ xe/chủ xe cập nhật status → `ON_TRIP`
   - Chụp ảnh xe khi nhận (5 góc: trước, sau, trái, phải, dashboard)
   - Sử dụng xe

7. **Trả xe**
   - Đến ngày trả → Chụp ảnh xe khi trả (5 góc)
   - Chủ xe kiểm tra → Cập nhật status → `COMPLETED`
   - Hoàn tiền cọc (nếu không có sự cố)
   - Đánh giá xe và chủ xe

### 5) Luồng trở thành Vendor (Chủ xe)

**Tiền đề**: Người dùng đang là `USER` với `isVendor = false`

1. **Xác thực danh tính (KYC) - Bắt buộc**
   - Upload CMND/CCCD (mặt trước, mặt sau)
   - Upload giấy phép lái xe (mặt trước, mặt sau)
   - Upload ảnh selfie
   - Gửi duyệt → KYC status = `PENDING`
   - Admin duyệt → `APPROVED` hoặc `REJECTED`

2. **Xác thực số điện thoại**
   - Phải có `isPhoneVerified = true`

3. **Đăng xe mới**
   - Điền thông tin xe: loại xe, hãng, đời, màu, biển số, hình ảnh
   - Thiết lập giá thuê/ngày, tiền đặt cọc
   - Thiết lập vị trí (địa chỉ, tọa độ GPS)
   - Thiết lập phí giao xe (nếu có)
   - Lưu dưới dạng `DRAFT` hoặc gửi duyệt ngay → `PENDING`

4. **Admin/Support duyệt xe**
   - Xem thông tin xe, hình ảnh, giấy tờ
   - Nếu đạt → `APPROVED` (xe có thể cho thuê)
   - Nếu không đạt → `REJECTED` (có thể chỉnh sửa và gửi lại)

5. **Tự động trở thành Vendor**
   - Khi xe đầu tiên được `APPROVED`, hệ thống tự động set `isVendor = true`
   - Người dùng có thể quản lý xe, nhận yêu cầu thuê, xác nhận đơn thuê, trao đổi tin nhắn, nhận thanh toán

6. **Quản lý xe**
   - Xem danh sách xe của mình
   - Chỉnh sửa xe (chỉ khi status = `DRAFT` hoặc `REJECTED`)
   - Ẩn/hiện xe (`HIDDEN` ↔ `APPROVED`)
   - Đặt xe vào bảo trì (`MAINTENANCE`)

### 6) Luồng Admin/Support

1. **Quản lý người dùng**
   - Xem danh sách người dùng
   - Khóa/mở khóa tài khoản (`isActive`)
   - Thay đổi role (nếu cần)

2. **Duyệt KYC**
   - Xem danh sách KYC `PENDING`
   - Kiểm tra giấy tờ, ảnh selfie
   - `APPROVE` hoặc `REJECT` (kèm lý do)

3. **Duyệt xe**
   - Xem danh sách xe `PENDING`
   - Kiểm tra thông tin, hình ảnh, giấy tờ (cavet)
   - `APPROVE` → xe có thể cho thuê, user tự động trở thành vendor (nếu là xe đầu tiên)
   - `REJECT` → từ chối (kèm lý do)

4. **Giám sát giao dịch**
   - Theo dõi Rentals, thanh toán, hoàn tiền đặt cọc
   - Xử lý tranh chấp (`DISPUTED`)
   - Quản lý commission và thanh toán cho chủ xe

5. **Quản lý commission**
   - Xem commission theo tuần của các chủ xe
   - Duyệt thanh toán commission (khi chủ xe upload hóa đơn)

### 7) Kiến trúc luồng dữ liệu

- **Mobile/Web** → **Backend API (JWT)** → **PostgreSQL (Prisma ORM)**
- **Thông báo**: In-app notifications + Push notifications + Email
- **Thanh toán**: Stripe (Payment Intents, Transfers, Refunds)
- **File Storage**: AWS S3 (hình ảnh, giấy tờ)
- **Trạng thái là nguồn sự thật (source of truth)** cho UI

### 8) Ràng buộc & kiểm tra ở Backend

- Chỉ xe `APPROVED` mới được hiển thị để đặt
- Chỉ user có KYC `APPROVED` và `isPhoneVerified = true` mới được tạo xe
- Admin/Support mới có quyền duyệt/từ chối KYC và xe
- Chủ xe chỉ có thể xác nhận/từ chối đơn thuê ở trạng thái `AWAIT_APPROVAL`
- Kiểm tra dữ liệu đầu vào (DTO/validation), phân quyền (JWT + RolesGuard)
- Kiểm tra chuyển đổi trạng thái hợp lệ (status transitions)

### 9) Tính toán giá và doanh thu

Xem chi tiết trong file [PRICING_BUSINESS_LOGIC.md](./PRICING_BUSINESS_LOGIC.md)

**Tóm tắt**:

- **Tổng tiền người thuê trả** = (Giá thuê × Số ngày) + Phí giao xe + Phí bảo hiểm - Giảm giá
- **Thu nhập chủ xe** = (Giá thuê × Số ngày) - Phí nền tảng + Phí giao xe
- **Doanh thu nền tảng** = Phí nền tảng - Giảm giá + Hoa hồng bảo hiểm

### 10) API & Màn hình chính

#### Auth

- `POST /auth/register` - Đăng ký
- `POST /auth/send-otp` - Gửi OTP
- `POST /auth/verify-otp` - Xác thực OTP
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Đặt lại mật khẩu

#### User & KYC

- `GET /users/me` - Thông tin user hiện tại
- `PUT /users/me` - Cập nhật profile
- `POST /users/kyc` - Gửi KYC
- `GET /users/kyc/me` - Xem trạng thái KYC

#### Vehicles

- `POST /vehicles` - Tạo xe mới
- `GET /vehicles` - Danh sách xe (public)
- `GET /vehicles/:id` - Chi tiết xe
- `GET /vehicles/me` - Danh sách xe của tôi
- `PUT /vehicles/:id` - Cập nhật xe
- `POST /vehicles/:id/submit` - Gửi duyệt xe
- `POST /vehicles/:id/status` - Thay đổi trạng thái xe (owner)
- `POST /admin/vehicles/:id/approve` - Duyệt xe (admin)
- `POST /admin/vehicles/:id/reject` - Từ chối xe (admin)

#### Rentals

- `POST /rentals` - Tạo đơn thuê
- `GET /rentals` - Danh sách đơn thuê của tôi
- `GET /rentals/:id` - Chi tiết đơn thuê
- `POST /rentals/:id/status` - Cập nhật trạng thái đơn thuê
- `POST /rentals/:id/evidences` - Upload ảnh nhận/trả xe

#### Chat & Messages

- `GET /chats` - Danh sách cuộc trò chuyện
- `GET /chats/:id/messages` - Tin nhắn trong chat
- `POST /chats/:id/messages` - Gửi tin nhắn

#### Reviews

- `POST /reviews` - Tạo đánh giá
- `GET /vehicles/:id/reviews` - Đánh giá của xe

#### Commission (Owner)

- `GET /commission/me` - Commission của tôi
- `GET /commission/payments` - Lịch sử thanh toán commission
- `POST /commission/payments` - Tạo yêu cầu thanh toán

### 11) Ghi chú triển khai

- Sau khi thay đổi schema Prisma, cần chạy migrate + generate:

  ```bash
  cd backend && npx prisma migrate dev -n <desc> && npx prisma generate
  ```

- Thông báo được gửi tại các mốc:
  - Nộp/duyệt KYC
  - Nộp/duyệt xe
  - Tạo/xác nhận/hủy đơn thuê
  - Thay đổi trạng thái rental
  - Thanh toán thành công/thất bại

- Audit log được ghi lại cho mọi thao tác quan trọng (tạo, cập nhật, duyệt, từ chối)

- Commission được tính theo tuần (Thứ 2 - Chủ nhật), chủ xe có thể yêu cầu thanh toán sau khi upload hóa đơn

---

Tài liệu này phản ánh logic thực tế đã triển khai trong hệ thống và có thể được cập nhật khi có thay đổi nghiệp vụ.
