# 📱 Cấu Hình SMS Service (Twilio)

## Tổng quan

Hệ thống đã được tích hợp SMS service để gửi OTP xác minh số điện thoại. Hiện tại sử dụng Twilio làm SMS provider.

## 📋 Bước 1: Tạo tài khoản Twilio

1. Truy cập: https://www.twilio.com/try-twilio
2. Đăng ký tài khoản miễn phí
3. Xác minh email và số điện thoại
4. Vào Dashboard → **Account** → **API Keys & Tokens**

## 📋 Bước 2: Lấy Credentials

1. **Account SID**: Tìm trong Dashboard (có dạng `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
2. **Auth Token**: Click "Show" để hiển thị (có dạng `your_auth_token_here`)
3. **Phone Number**: Vào **Phone Numbers** → **Manage** → **Buy a number** (hoặc dùng số trial miễn phí)

⚠️ **Lưu ý về Trial Account**:

- Trial account có giới hạn: **chỉ gửi SMS đến số điện thoại đã verify** trong Twilio Dashboard
- Để gửi SMS đến bất kỳ số nào, cần upgrade account
- Trial account có $15.50 credit miễn phí để test

## 📋 Bước 2.1: Verify Số Điện Thoại (QUAN TRỌNG cho Trial)

Để test SMS với trial account, bạn **PHẢI** verify số điện thoại nhận SMS trước:

1. Vào Twilio Dashboard → **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new Caller ID** hoặc **Verify a number**
3. Nhập số điện thoại muốn nhận SMS (format: +84901234567)
4. Chọn **Verify via SMS** hoặc **Verify via Call**
5. Nhập mã OTP nhận được từ Twilio
6. Sau khi verify thành công, số điện thoại sẽ xuất hiện trong danh sách **Verified Caller IDs**

✅ **Sau khi verify**: Bạn có thể gửi SMS đến số đó từ trial account

❌ **Nếu chưa verify**: SMS sẽ bị reject với lỗi "The number +84... is unverified"

## 📋 Bước 3: Cài đặt Twilio SDK

**BẮT BUỘC** để gửi SMS thật:

```bash
cd backend
pnpm add twilio
```

Sau đó cập nhật code trong `src/sms/sms.service.ts`:

1. Uncomment import:

```typescript
import twilio from 'twilio';
```

2. Uncomment code trong constructor:

```typescript
constructor() {
  if (ENV.twilio.accountSid && ENV.twilio.authToken) {
    this.twilioClient = twilio(ENV.twilio.accountSid, ENV.twilio.authToken);
    this.logger.log('Twilio SMS service initialized');
  } else {
    this.logger.warn('Twilio credentials not found. SMS service will log messages only.');
  }
}
```

3. Uncomment code trong sendOTP method (thay thế phần dev mode):

```typescript
if (ENV.twilio?.accountSid && ENV.twilio?.authToken) {
  const result = await this.twilioClient.messages.create({
    body: message,
    from: ENV.twilio.phoneNumber,
    to: formattedPhone,
  });

  this.logger.log(
    `SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`,
  );
  return {
    success: true,
    message: 'SMS đã được gửi thành công',
    messageId: result.sid,
  };
}
```

## 📋 Bước 4: Thêm Biến Môi Trường

### Local development (.env)

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Số điện thoại Twilio của bạn (format: +84901234567)
```

### Production (Render.com / Vercel / etc.)

Thêm các biến môi trường tương tự trong dashboard của hosting provider.

## 📋 Bước 5: Chạy Migration

Sau khi cập nhật schema, chạy migration:

```bash
cd backend
pnpm migrate:dev
```

Migration sẽ thêm:

- Trường `isPhoneVerified` vào bảng `users`
- Trường `type` và `phone` vào bảng `otps`

## 🚀 Sử dụng

### API Endpoints

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

### Flow xác minh số điện thoại

1. User đăng ký với số điện thoại → OTP được gửi qua email và SMS (nếu có)
2. User đăng nhập → Nếu chưa xác minh số điện thoại, có thể gọi API để xác minh
3. User cập nhật số điện thoại → `isPhoneVerified` tự động reset về `false`, cần xác minh lại

## 🔧 Development Mode

Nếu không cấu hình Twilio credentials, hệ thống sẽ chạy ở **dev mode**:

- SMS không được gửi thật
- OTP code được log ra console
- Có thể test flow mà không cần Twilio account

## 📝 Lưu ý

- OTP có thời hạn 10 phút
- Mỗi OTP chỉ sử dụng được 1 lần
- Format số điện thoại: tự động thêm country code (+84 cho Việt Nam)
- Nếu số điện thoại đã được xác minh, không thể gửi OTP lại cho số đó

## 🎯 Hướng Dẫn Chi Tiết Trial Account

Xem file `TWILIO_TRIAL_GUIDE.md` để biết cách:

- Verify số điện thoại trong Twilio Dashboard
- Test SMS với trial account
- Xử lý lỗi thường gặp
- Upgrade account khi cần

## 🔄 Thay đổi SMS Provider

Để sử dụng SMS provider khác (như AWS SNS, Vonage, etc.), chỉ cần:

1. Cập nhật `SmsService` trong `src/sms/sms.service.ts`
2. Cập nhật biến môi trường trong `src/config/env.ts`
3. Cập nhật logic gửi SMS trong method `sendOTP`
