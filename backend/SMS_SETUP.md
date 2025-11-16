# 📱 Cấu Hình SMS Service

## Tổng quan

Hệ thống hỗ trợ 2 chế độ SMS:

1. **Development Mode** (Mặc định): Log OTP vào console và file - **Không cần cấu hình gì, sẵn sàng dùng cho đồ án**
2. **Production Mode**: Gửi SMS thật qua AWS SNS (free tier: 100 SMS/tháng)

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

1. Vào **IAM** → **Users** → **Create user**
2. Chọn **Access key - Programmatic access**
3. Attach policy: `AmazonSNSFullAccess` (hoặc custom policy chỉ cho SMS)
4. Lưu lại **Access Key ID** và **Secret Access Key**

### Bước 3: Cấu hình Environment Variables

Thêm vào `.env`:

```env
# SMS Configuration
SMS_PROVIDER=production
AWS_SMS_ACCESS_KEY_ID=your_access_key_id
AWS_SMS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_SMS_REGION=ap-southeast-1  # Singapore (gần VN nhất)
```

### Bước 4: Cài đặt AWS SDK (nếu chưa có)

```bash
cd backend
pnpm add @aws-sdk/client-sns
```

### Bước 5: Kích hoạt SMS trong AWS SNS

1. Vào **AWS SNS Console** → **Text messaging (SMS)**
2. Chọn **Sandbox** mode (free tier) hoặc **Production**
3. Sandbox mode: Chỉ gửi được đến số đã verify (free)
4. Production: Gửi được đến bất kỳ số nào (tốn phí sau 100 SMS/tháng)

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
