# 📱 Hướng Dẫn Sử Dụng Twilio Trial Account

## ⚠️ QUAN TRỌNG: Trial Account Chỉ Gửi Được Đến Số Đã Verify

Twilio trial account có giới hạn: **chỉ gửi SMS đến số điện thoại đã được verify** trong Twilio Dashboard.

## 🚀 Các Bước Setup Trial Account

### Bước 1: Đăng Ký Twilio Trial

1. Truy cập: https://www.twilio.com/try-twilio
2. Đăng ký với email và số điện thoại
3. Xác minh email và số điện thoại của bạn
4. Bạn sẽ nhận được **$15.50 credit** miễn phí để test

### Bước 2: Lấy Credentials

1. Vào Dashboard → **Account** → **API Keys & Tokens**
2. Copy **Account SID** (dạng: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Click "Show" để hiển thị **Auth Token** và copy
4. Vào **Phone Numbers** → **Manage** → Bạn sẽ thấy một số trial (dạng: `+1 555...`)

### Bước 3: Verify Số Điện Thoại Nhận SMS (BẮT BUỘC)

Đây là bước **QUAN TRỌNG NHẤT** để test với trial account:

1. Vào Twilio Dashboard → **Phone Numbers** → **Verified Caller IDs**
2. Click **Add a new Caller ID** hoặc **Verify a number**
3. Nhập số điện thoại muốn nhận SMS (format: `+84901234567`)
   - ⚠️ **Lưu ý**: Phải có country code (+84 cho Việt Nam)
4. Chọn phương thức verify:
   - **Verify via SMS**: Twilio sẽ gửi mã OTP đến số đó
   - **Verify via Call**: Twilio sẽ gọi và đọc mã OTP
5. Nhập mã OTP nhận được
6. Sau khi verify thành công, số điện thoại sẽ xuất hiện trong danh sách

✅ **Sau khi verify**: Bạn có thể gửi SMS đến số đó từ trial account

❌ **Nếu chưa verify**: SMS sẽ bị reject với lỗi:
```
The number +84901234567 is unverified. Trial accounts cannot send messages to unverified numbers
```

### Bước 4: Cài Đặt Twilio SDK

```bash
cd backend
pnpm add twilio
```

### Bước 5: Cập Nhật Code

Uncomment code trong `backend/src/sms/sms.service.ts`:

1. **Import Twilio**:
```typescript
import twilio from 'twilio';
```

2. **Khởi tạo client trong constructor**:
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

3. **Uncomment phần gửi SMS thật** (thay thế dev mode):
```typescript
if (ENV.twilio?.accountSid && ENV.twilio?.authToken) {
  const result = await this.twilioClient.messages.create({
    body: message,
    from: ENV.twilio.phoneNumber,
    to: formattedPhone,
  });

  this.logger.log(`SMS sent successfully to ${formattedPhone}. SID: ${result.sid}`);
  return {
    success: true,
    message: 'SMS đã được gửi thành công',
    messageId: result.sid,
  };
}
```

### Bước 6: Thêm Biến Môi Trường

Thêm vào `.env`:

```env
# Twilio Trial Account
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567  # Số trial từ Twilio (format: +1 555...)
```

## 🧪 Test SMS

1. Đảm bảo số điện thoại đã được verify trong Twilio Dashboard
2. Gọi API:
```bash
POST /api/auth/phone/send-otp
Headers: Authorization: Bearer <token>
Body: { "phone": "0901234567" }  # Số đã verify
```

3. Kiểm tra SMS trên điện thoại
4. Kiểm tra logs trong Twilio Dashboard → **Monitor** → **Logs** → **Messaging**

## ⚠️ Lỗi Thường Gặp

### Lỗi: "The number is unverified"

**Nguyên nhân**: Số điện thoại chưa được verify trong Twilio Dashboard

**Giải pháp**: 
1. Vào **Phone Numbers** → **Verified Caller IDs**
2. Verify số điện thoại đó
3. Thử lại

### Lỗi: "Trial accounts cannot send messages to unverified numbers"

**Nguyên nhân**: Đang dùng trial account và số chưa verify

**Giải pháp**: 
- Verify số trong Twilio Dashboard, hoặc
- Upgrade account để gửi đến bất kỳ số nào

### Lỗi: "Invalid phone number format"

**Nguyên nhân**: Format số điện thoại không đúng

**Giải pháp**: 
- Đảm bảo có country code: `+84901234567` (không phải `0901234567`)
- Code tự động format, nhưng nếu vẫn lỗi, kiểm tra lại

## 💡 Tips

1. **Test với nhiều số**: Verify nhiều số điện thoại để test với nhiều user
2. **Monitor logs**: Luôn kiểm tra Twilio Dashboard → **Monitor** → **Logs** để debug
3. **Check balance**: Vào **Account** → **Usage** để xem credit còn lại
4. **Upgrade khi sẵn sàng**: Khi cần gửi đến bất kỳ số nào, upgrade account

## 🔄 Upgrade Account

Khi cần gửi SMS đến bất kỳ số nào (không cần verify):

1. Vào Twilio Dashboard → **Account** → **Upgrade**
2. Thêm payment method
3. Sau khi upgrade, có thể gửi SMS đến bất kỳ số nào

## 📊 Giới Hạn Trial Account

- ✅ $15.50 credit miễn phí
- ✅ Gửi SMS đến số đã verify
- ❌ Không gửi được đến số chưa verify
- ❌ Có message prefix: "Sent from your Twilio trial account"
- ✅ Đủ để test và phát triển

## 🔗 Tài Liệu Tham Khảo

- Twilio Docs: https://www.twilio.com/docs/sms
- Verify Numbers: https://www.twilio.com/docs/verify/quickstarts
- Trial Account Limits: https://support.twilio.com/hc/en-us/articles/223183068-Twilio-trial-accounts

