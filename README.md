## Tài liệu luồng nghiệp vụ: Thuê xe P2P (Renter ↔ Owner ↔ Admin)

Tài liệu này mô tả chi tiết luồng thao tác thực tế trong hệ thống cho thuê xe ngang hàng, từ góc nhìn Người thuê (Renter), Người cho thuê/Chủ xe (Owner) và Quản trị (Admin). Bao gồm các điều kiện, trạng thái, kiểm duyệt và các điểm tích hợp UI/API chính.

### 1) Thuật ngữ chính
- **Renter (Người thuê)**: Người dùng thuê xe để sử dụng.
- **Owner (Chủ xe)**: Người dùng cung cấp xe để cho thuê. Người dùng mới mặc định là RENTER; để trở thành OWNER cần đáp ứng điều kiện và được admin duyệt.
- **Admin**: Quản trị hệ thống, kiểm duyệt hồ sơ, xe, và yêu cầu trở thành chủ xe.
- **KYC**: Xác thực danh tính người dùng (giấy tờ tuỳ thân, ảnh selfie,...).
- **Owner Application**: Yêu cầu “Đăng ký làm chủ xe” của người dùng.
- **Vehicle Verification**: Kiểm duyệt xe đăng tải trước khi được cho thuê.

### 2) Trạng thái và điều kiện quan trọng
- UserRole: `RENTER` → (duyệt) → `OWNER` → (ADMIN tùy cấp quyền) → `ADMIN`
- OwnerApplicationStatus: `PENDING` | `APPROVED` | `REJECTED`
- Vehicle lifecycle đề xuất:
  - `DRAFT` (chưa đủ thông tin) → `SUBMITTED` (gửi duyệt) → `VERIFIED` (được duyệt) | `REJECTED` (bị từ chối) → có thể `RESUBMIT`
  - `ACTIVE`/`INACTIVE` (bật/tắt hiển thị), `AVAILABLE` (khả dụng) tách riêng khỏi trạng thái kiểm duyệt.
- RentalStatus: `PENDING` → `CONFIRMED` → `ACTIVE` → `COMPLETED` | (có thể) `CANCELLED` / `DISPUTED`

Điều kiện then chốt để trở thành chủ xe:
- Người dùng phải có ít nhất 1 xe đã được VERIFY/VERIFIED.
- Sau khi thoả điều kiện, gửi Owner Application và chờ Admin duyệt.

### 3) Luồng Người dùng Renter (Người thuê)
1. Đăng ký tài khoản → Xác thực OTP → Đăng nhập.
2. Cập nhật hồ sơ (tuỳ chọn) và/hoặc KYC (nếu hệ thống yêu cầu trước khi thuê).
3. Tìm kiếm xe:
   - Lọc theo thành phố, thời gian, loại xe, giá.
4. Xem chi tiết xe (chỉ xe `VERIFIED` mới hiển thị để đặt).
5. Gửi yêu cầu đặt xe (Booking): tạo `Rental` với `PENDING`.
6. Chủ xe nhận thông báo → `CONFIRMED` hoặc `REJECT/CANCELLED`.
7. Khi đến thời điểm thuê, trạng thái → `ACTIVE`.
8. Kết thúc thuê → `COMPLETED` (tính toán chi phí, phí dịch vụ, hoàn cọc nếu có).
9. Đánh giá/review xe/chủ xe (tuỳ chính sách).

Touchpoints (ví dụ):
- Mobile App: Tab tìm kiếm, chi tiết xe, đặt xe, lịch sử thuê.
- API: Rentals (create/list/status update), Notifications.

### 4) Luồng trở thành Owner (Người cho thuê/chủ xe)
Tiền đề: Người dùng đang là `RENTER`.

4.1. Xác thực danh tính (KYC) – khuyến nghị
- Gửi ảnh giấy tờ KYC. Trạng thái KYC có thể là `PENDING`/`APPROVED`/`REJECTED` (tuỳ hệ thống triển khai chi tiết).

4.2. Đăng xe mới
- Điền thông tin xe: loại xe, hãng, đời, màu, biển số, hình ảnh, giá, tiền đặt cọc, vị trí.
- Gửi duyệt → xe ở trạng thái `SUBMITTED`.
- Admin/Reviewer kiểm duyệt:
  - Nếu đạt → `VERIFIED` (hiển thị và có thể cho thuê).
  - Nếu không đạt → `REJECTED` (cho phép chỉnh sửa và gửi lại `RESUBMIT`).

4.3. Gửi “Đăng ký làm chủ xe” (Owner Application)
- Điều kiện hệ thống: Phải có ÍT NHẤT 1 xe ở trạng thái `VERIFIED`.
- Người dùng nhấn “Đăng ký làm chủ xe” trong tab Profile.
- Tạo `OwnerApplication` với trạng thái `PENDING`.
- Nếu bị `REJECTED`, có thể chỉnh sửa/hoàn thiện rồi gửi lại.

4.4. Sau khi được Admin duyệt
- Hệ thống cập nhật `User.role = OWNER`.
- Người dùng có thể quản lý xe, nhận yêu cầu thuê, xác nhận đơn thuê, trao đổi tin nhắn, nhận thanh toán.

Touchpoints (ví dụ):
- Mobile App: Tab Profile → phần “Đăng ký làm chủ xe”; Màn hình quản lý xe (tạo/sửa/gửi duyệt), nhận thông báo.
- API: `/users/owner-application` (submit), `/users/owner-application/me` (xem trạng thái), Vehicles APIs (create/submit/verify status).

### 5) Luồng Admin
5.1. Quản lý người dùng
- Xem danh sách, khoá/mở khoá, thay đổi vai trò (nếu cần theo quy trình).

5.2. Duyệt xe
- Xem xe `SUBMITTED` → kiểm tra giấy tờ/hình ảnh → `VERIFIED` hoặc `REJECTED` (kèm lý do).

5.3. Duyệt yêu cầu “Đăng ký làm chủ xe”
- Danh sách Owner Applications `PENDING`.
- Kiểm tra điều kiện: người dùng có ≥ 1 xe `VERIFIED` (hệ thống kiểm tra/nhắc nhở).
- `APPROVE` → cập nhật `User.role = OWNER`.
- `REJECT` → lưu ghi chú lý do.

5.4. Giám sát giao dịch và xử lý khiếu nại
- Theo dõi Rentals, thanh toán, hoàn tiền đặt cọc.
- Can thiệp `DISPUTED` theo chính sách.

Touchpoints (ví dụ):
- Web Admin: Dashboard, danh sách xe chờ duyệt, danh sách yêu cầu trở thành chủ xe, danh sách đơn thuê.
- API: `/users/owner-applications` (list), `/users/owner-applications/:id/approve`, `/users/owner-applications/:id/reject`, Vehicles admin endpoints.

### 6) Kiến trúc luồng dữ liệu (tóm tắt)
- Mobile/Web → Backend API (JWT) → DB (PostgreSQL qua Prisma).
- Thông báo: in-app notifications + email (có thể mở rộng).
- Trạng thái là nguồn sự thật (source of truth) cho UI.

### 7) Ràng buộc & kiểm tra ở Backend (khuyến nghị/đã triển khai một phần)
- Chỉ xe `VERIFIED` mới được hiển thị để đặt.
- Chỉ cho phép gửi Owner Application khi người dùng có ≥ 1 `Vehicle.VERIFIED`.
- Admin mới có quyền duyệt/từ chối owner application và verify xe.
- Kiểm tra dữ liệu đầu vào (DTO/validation), phân quyền (JWT + RolesGuard).

### 8) Trải nghiệm UI đề xuất
- Renter
  - Tìm kiếm nhanh, filter rõ ràng, xem lịch xe.
  - Quy trình đặt xe 3 bước: chọn xe → chọn thời gian/điểm nhận-trả → xác nhận.
- Owner
  - Wizard đăng xe (nhiều bước, lưu DRAFT), preview trước khi gửi duyệt.
  - Trung tâm yêu cầu: thấy danh sách yêu cầu thuê, xác nhận/huỷ, chat nhanh.
- Admin
  - Hàng đợi duyệt xe và duyệt Owner Application.
  - Bộ lọc theo trạng thái, ngày, người dùng.

### 9) API & Màn hình chính (tham chiếu nhanh)
- Auth: đăng ký, OTP, đăng nhập, refresh, đổi mật khẩu, profile, KYC.
- Vehicles: tạo/sửa, upload ảnh, nộp duyệt, duyệt (Admin), bật/tắt hiển thị.
- Owner Application:
  - User: POST `/users/owner-application`, GET `/users/owner-application/me`
  - Admin: GET `/users/owner-applications`, POST `/:id/approve`, POST `/:id/reject`
- Rentals: tạo đơn, chủ xe xác nhận, bắt đầu-kết thúc, thanh toán.

### 10) Ghi chú triển khai
- Sau khi thay đổi schema, cần chạy migrate + generate Prisma:
  - `cd backend && npx prisma migrate dev -n <desc> && npx prisma generate`
- Nên mở rộng bảng/field để lưu trữ KYC và Vehicle Verification chi tiết (file chứng từ, người duyệt, thời gian, audit log).
- Thêm thông báo (email/in-app) tại các mốc: nộp/duyệt KYC, nộp/duyệt xe, gửi/duyệt owner application, thay đổi trạng thái rental.

---
Tài liệu này phản ánh luồng thực tế chuẩn trong mô hình cho thuê xe P2P và có thể tinh chỉnh thêm theo chính sách vận hành cụ thể của sản phẩm.

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
