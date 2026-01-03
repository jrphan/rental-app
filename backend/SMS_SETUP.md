# 📱 Cấu Hình SMS Service

## Tổng quan

Hệ thống hỗ trợ 2 chế độ SMS:

1. **Development Mode** (Mặc định): Log OTP vào console và file - **Không cần cấu hình gì, sẵn sàng dùng cho đồ án**
2. **Production Mode**: Gửi SMS thật qua AWS SNS (free tier: 100 SMS/tháng)

## 🎯 Tóm tắt nhanh: Lấy AWS Credentials

Sau khi setup xong, bạn cần 3 giá trị này cho file `.env`:

1. **AWS_SMS_ACCESS_KEY_ID**: Lấy từ IAM → Users → Create user → Access key
2. **AWS_SMS_SECRET_ACCESS_KEY**: Lấy cùng lúc với Access Key ID (chỉ thấy 1 lần!)
3. **AWS_SMS_REGION**: Dùng `ap-southeast-1` (Singapore) - khuyến nghị cho VN

👉 Xem chi tiết từng bước bên dưới

## 🚀 Development Mode (Mặc định - Khuyến nghị cho đồ án)

**Không cần cấu hình gì!** Service sẽ tự động log OTP vào:

- Console (dễ nhìn khi chạy server)
- File log: `logs/sms/sms-YYYY-MM-DD.log`

Khi user yêu cầu OTP, bạn sẽ thấy trong console:

```
═══════════════════════════════════════
📱 SMS OTP (Development Mode)
═══════════════════════════════════════
To: +84901234567
OTP Code: 123456
Time: 2024-01-15T10:30:00.000Z
Message: Mã xác thực của bạn là: 123456...
═══════════════════════════════════════
```

**Ưu điểm:**

- ✅ Hoàn toàn miễn phí
- ✅ Không cần đăng ký dịch vụ nào
- ✅ Dễ test và debug
- ✅ Phù hợp cho đồ án, demo

## 📋 Production Mode (AWS SNS)

Nếu muốn gửi SMS thật trong production, có thể dùng AWS SNS:

### Bước 1: Tạo AWS Account

1. Truy cập: https://aws.amazon.com/
2. Tạo tài khoản miễn phí (có 12 tháng free tier)
3. AWS SNS SMS: **100 SMS/tháng miễn phí** (đủ cho demo)

### Bước 2: Tạo IAM User cho SMS

#### 2.1. Truy cập IAM Console

1. Đăng nhập vào AWS Console: https://console.aws.amazon.com/
2. Tìm kiếm "IAM" trong thanh search hoặc vào **Services** → **IAM**
3. Click vào **Users** ở menu bên trái

#### 2.2. Tạo User mới

1. Click nút **Create user** (màu xanh)
2. **User name**: Nhập tên user (ví dụ: `sms-service-user`)
3. **Select AWS credential type**:
   - ✅ Chọn **Access key - Programmatic access**
   - Bỏ chọn **Password - AWS Management Console access** (không cần)
4. Click **Next**

#### 2.3. Gán quyền (Permissions)

1. Chọn **Attach policies directly**
2. Tìm và chọn policy: **AmazonSNSFullAccess**
   - Hoặc tìm kiếm "SNS" trong ô search
   - Tích vào checkbox của `AmazonSNSFullAccess`
3. Click **Next**

#### 2.4. Review và tạo User

1. Review lại thông tin
2. Click **Create user**

#### 2.5. Lưu Access Keys (QUAN TRỌNG!)

⚠️ **LƯU Ý: Bạn chỉ thấy Secret Access Key MỘT LẦN DUY NHẤT!**

1. Sau khi tạo user thành công, bạn sẽ thấy màn hình hiển thị:
   - **Access key ID**: Ví dụ: `AKIAIOSFODNN7EXAMPLE`
   - **Secret access key**: Ví dụ: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

2. **BẮT BUỘC phải lưu ngay:**
   - Click **Download .csv** để tải file chứa credentials
   - HOẶC copy và lưu vào nơi an toàn (password manager, notes, etc.)
   - ⚠️ Nếu đóng trang này, bạn sẽ KHÔNG THỂ xem lại Secret Access Key!

3. Click **Done** để hoàn tất

#### 2.6. Lấy lại Access Keys (nếu đã mất)

Nếu bạn đã mất Secret Access Key, bạn cần tạo Access Key mới:

1. Vào **IAM** → **Users** → Chọn user vừa tạo
2. Tab **Security credentials**
3. Scroll xuống phần **Access keys**
4. Click **Create access key**
5. Chọn use case: **Application running outside AWS**
6. Click **Next** → **Create access key**
7. Lưu lại Access Key ID và Secret Access Key (chỉ thấy 1 lần!)

### Bước 3: Cấu hình Environment Variables

Thêm vào file `.env` trong thư mục `backend/`:

```env
# SMS Configuration
NODE_ENV=production
SMS_PROVIDER=production
AWS_SMS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Thay bằng Access Key ID của bạn
AWS_SMS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Thay bằng Secret Access Key của bạn
AWS_SMS_REGION=ap-southeast-1  # Singapore (gần VN nhất, khuyến nghị cho Việt Nam)
```

#### Giải thích các giá trị:

- **NODE_ENV=production**: Bắt buộc phải là `production` để kích hoạt SMS thật
- **SMS_PROVIDER=production**: Chuyển từ development sang production mode
- **AWS_SMS_ACCESS_KEY_ID**:
  - Lấy từ bước 2.5 (Access Key ID)
  - Format: `AKIA...` (bắt đầu bằng AKIA)
  - Ví dụ: `AKIAIOSFODNN7EXAMPLE`
- **AWS_SMS_SECRET_ACCESS_KEY**:
  - Lấy từ bước 2.5 (Secret Access Key)
  - Format: chuỗi dài khoảng 40 ký tự
  - Ví dụ: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
  - ⚠️ Giữ bí mật, không commit lên Git!
- **AWS_SMS_REGION**:
  - Region gần Việt Nam nhất: `ap-southeast-1` (Singapore)
  - Các region khác có thể dùng:
    - `ap-southeast-2` (Sydney, Australia)
    - `us-east-1` (N. Virginia, USA) - mặc định AWS
  - Khuyến nghị: `ap-southeast-1` cho tốc độ tốt nhất

#### Ví dụ file .env hoàn chỉnh:

```env
# ... các config khác ...

# SMS Configuration
NODE_ENV=production
SMS_PROVIDER=production
AWS_SMS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
AWS_SMS_SECRET_ACCESS_KEY=abc123xyz789secretkey456defghi
AWS_SMS_REGION=ap-southeast-1
```

⚠️ **Lưu ý bảo mật:**

- KHÔNG commit file `.env` lên Git
- Đảm bảo file `.env` đã có trong `.gitignore`
- Nếu dùng Git, xem xét dùng `.env.example` (không có giá trị thật)

### Bước 4: Cài đặt AWS SDK (Đã hoàn thành ✅)

Package đã được cài đặt sẵn. Nếu cần cài lại:

```bash
cd backend
pnpm add @aws-sdk/client-sns
```

### Bước 4: Chọn AWS Region (nếu cần thay đổi)

Mặc định đã set `ap-southeast-1` (Singapore) - tốt nhất cho Việt Nam.

Nếu muốn đổi region:

1. Vào AWS Console → Chọn region ở góc trên bên phải
2. Các region khuyến nghị:
   - **ap-southeast-1** (Singapore) - ⭐ Khuyến nghị cho VN
   - **ap-southeast-2** (Sydney, Australia)
   - **us-east-1** (N. Virginia, USA) - mặc định AWS
3. Copy tên region (ví dụ: `ap-southeast-1`)
4. Dùng trong `.env`: `AWS_SMS_REGION=ap-southeast-1`

### Bước 5: Kích hoạt SMS trong AWS SNS

#### 5.1. Truy cập SNS Console

1. Vào AWS Console: https://console.aws.amazon.com/
2. Tìm kiếm "SNS" hoặc vào **Services** → **Simple Notification Service (SNS)**
3. Đảm bảo đang ở đúng region (góc trên bên phải)

#### 5.2. Kích hoạt SMS

1. Ở menu bên trái, click **Text messaging (SMS)**
2. Bạn sẽ thấy 2 options:

   **Option A: Sandbox mode (Miễn phí - Khuyến nghị cho test)**
   - ✅ Hoàn toàn miễn phí
   - ✅ Không giới hạn số lượng SMS
   - ❌ Chỉ gửi được đến số điện thoại đã verify
   - 📝 Cách verify số: Vào **Phone numbers** → **Add phone number** → Nhập số → Nhận code → Verify

   **Option B: Production mode (Có phí sau free tier)**
   - ✅ Gửi được đến bất kỳ số nào
   - ✅ 100 SMS/tháng miễn phí (free tier)
   - ❌ Sau 100 SMS: ~$0.00645/SMS (tùy region)
   - ⚠️ Cần request production access từ AWS (có thể mất vài giờ đến vài ngày)

#### 5.3. Request Production Access (nếu cần)

Nếu muốn gửi đến số bất kỳ (không cần verify):

1. Vào **Text messaging (SMS)** → **Account preferences**
2. Scroll xuống **Account spending limit**
3. Set spending limit (ví dụ: $10) để tránh phí phát sinh
4. Click **Request production access**
5. Điền form:
   - Use case: Chọn "Transactional" (OTP, verification codes)
   - Website URL: URL của app/website
   - Description: Mô tả mục đích sử dụng SMS
6. Submit và chờ AWS approve (thường 1-24 giờ)

#### 5.4. Verify số điện thoại (nếu dùng Sandbox)

1. Vào **Text messaging (SMS)** → **Phone numbers**
2. Click **Add phone number**
3. Chọn country code (Vietnam: +84)
4. Nhập số điện thoại (không có +84, ví dụ: `901234567`)
5. Click **Add phone number**
6. AWS sẽ gửi code đến số đó
7. Nhập code để verify
8. Sau khi verify, có thể nhận SMS từ app

## 🔄 Chuyển đổi giữa Development và Production

### Development Mode (Mặc định)

```env
SMS_PROVIDER=development
# Hoặc không set gì cả
```

### Production Mode

```env
SMS_PROVIDER=production
AWS_SMS_ACCESS_KEY_ID=xxx
AWS_SMS_SECRET_ACCESS_KEY=xxx
AWS_SMS_REGION=ap-southeast-1
```

## 📝 Format số điện thoại

Service tự động format số điện thoại:

- `0901234567` → `+84901234567`
- `84901234567` → `+84901234567`
- `+84901234567` → `+84901234567` (giữ nguyên)

## 🎯 Sử dụng trong Code

Service đã được tích hợp sẵn, tự động detect mode:

```typescript
// Trong auth.service.ts
await this.smsService.sendOTP(phone, otpCode);
// Development: Log OTP
// Production: Gửi SMS thật
```

## 📊 API Endpoints

1. **Gửi OTP qua SMS**:

   ```
   POST /api/auth/phone/send-otp
   Headers: Authorization: Bearer <token>
   Body: { "phone": "0901234567" }
   ```

2. **Xác minh OTP**:

   ```
   POST /api/auth/phone/verify-otp
   Headers: Authorization: Bearer <token>
   Body: { "phone": "0901234567", "otpCode": "123456" }
   ```

3. **Gửi lại OTP**:
   ```
   POST /api/auth/phone/resend-otp
   Headers: Authorization: Bearer <token>
   Body: { "phone": "0901234567" }
   ```

## 💡 Khuyến nghị cho đồ án

**Sử dụng Development Mode:**

- ✅ Đơn giản, không cần config
- ✅ OTP hiển thị rõ ràng trong console/logs
- ✅ Dễ demo và test
- ✅ Hoàn toàn miễn phí

Chỉ chuyển sang Production Mode khi:

- Deploy lên server thật
- Cần gửi SMS thật cho user
- Có budget cho SMS

## 📁 Log Files

Development mode tạo log files tại:

```
backend/logs/sms/sms-2024-01-15.log
```

Mỗi ngày một file, dễ tra cứu OTP đã gửi.

## 🔧 Troubleshooting

### Development Mode không log OTP

- Kiểm tra console output
- Kiểm tra file `logs/sms/` có được tạo không
- Kiểm tra quyền write của thư mục `logs/`

### Production Mode không gửi SMS

- Kiểm tra AWS credentials trong `.env`
- Kiểm tra AWS SNS đã enable SMS chưa
- Kiểm tra số điện thoại đã verify trong AWS SNS Sandbox (nếu dùng Sandbox)
- Kiểm tra AWS region đúng chưa

## 📚 Tài liệu tham khảo

- AWS SNS SMS: https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html
- AWS Free Tier: https://aws.amazon.com/free/
