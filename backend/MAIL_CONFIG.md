# 📧 Cấu Hình Mail System - Chi Tiết

## Tổng Quan

Mail system trong Rental App sử dụng NestJS với thư viện `@nestjs-modules/mailer` để gửi email. Hệ thống hỗ trợ nhiều loại email templates và có thể cấu hình qua các biến môi trường.

---

## 📋 Bảng Tổng Quan Các Biến Môi Trường

| Biến            | Type    | Bắt buộc | Mặc định              | Mô tả                 |
| --------------- | ------- | -------- | --------------------- | --------------------- |
| `MAIL_HOST`     | string  | ✅       | -                     | SMTP server hostname  |
| `MAIL_PORT`     | number  | ✅       | 587                   | SMTP server port      |
| `MAIL_SECURE`   | boolean | ✅       | false                 | Sử dụng SSL/TLS       |
| `MAIL_USER`     | string  | ✅       | -                     | Email đăng nhập SMTP  |
| `MAIL_PASSWORD` | string  | ✅       | -                     | Mật khẩu/App Password |
| `MAIL_FROM`     | string  | ❌       | noreply@rentalapp.com | Email người gửi       |

---

## 🔍 Chi Tiết Từng Biến Môi Trường

### 1. MAIL_HOST

**Mô tả**: Địa chỉ hostname của SMTP server

**Giá trị cho Gmail**: `smtp.gmail.com`

**Giá trị cho các nhà cung cấp khác**:

- Outlook/Hotmail: `smtp-mail.outlook.com`
- Yahoo: `smtp.mail.yahoo.com`
- SendGrid: `smtp.sendgrid.net`
- Mailgun: `smtp.mailgun.org`
- Custom SMTP: Tên domain của SMTP server

**Ví dụ cấu hình**:

```env
# Gmail
MAIL_HOST=smtp.gmail.com

# Outlook
MAIL_HOST=smtp-mail.outlook.com

# Custom SMTP
MAIL_HOST=mail.yourcompany.com
```

---

### 2. MAIL_PORT

**Mô tả**: Port kết nối tới SMTP server

**Các port phổ biến**:

- `587`: TLS/STARTTLS (Khuyến nghị nhất)
- `465`: SSL/TLS
- `25`: SMTP plain text (thường bị ISP block)
- `2525`: Alternative port cho TLS

**Bảng port theo nhà cung cấp**:
| Nhà cung cấp | Port khuyến nghị | Port SSL |
|--------------|-------------------|----------|
| Gmail | 587 | 465 |
| Outlook | 587 | 465 |
| Yahoo | 587 | 465 |
| SendGrid | 587 | - |
| Mailgun | 587 | - |

**Ví dụ cấu hình**:

```env
# Port TLS (khuyến nghị)
MAIL_PORT=587

# Port SSL
MAIL_PORT=465

# Port alternative
MAIL_PORT=2525
```

---

### 3. MAIL_SECURE

**Mô tả**: Có sử dụng kết nối an toàn SSL/TLS hay không

**Giá trị**: `true` hoặc `false`

**Quy tắc cấu hình**:

- Port **587** → `MAIL_SECURE=false` (dùng STARTTLS)
- Port **465** → `MAIL_SECURE=true` (dùng SSL)
- Port **25** → `MAIL_SECURE=false` (không an toàn)

**Lưu ý**: Giá trị này PHẢI khớp với port được sử dụng, nếu không sẽ lỗi kết nối.

**Ví dụ cấu hình**:

```env
# Với port 587
MAIL_PORT=587
MAIL_SECURE=false

# Với port 465
MAIL_PORT=465
MAIL_SECURE=true
```

---

### 4. MAIL_USER

**Mô tả**: Email hoặc username dùng để xác thực với SMTP server

**Format**: Email đầy đủ hoặc username

**Lưu ý**:

- Với Gmail: Phải là email đầy đủ (ví dụ: `john.doe@gmail.com`)
- Với một số SMTP server: Chỉ cần username (ví dụ: `john.doe`)
- Không có khoảng trắng ở đầu/cuối

**Ví dụ cấu hình**:

```env
# Gmail - email đầy đủ
MAIL_USER=john.doe@gmail.com

# Outlook - email đầy đủ
MAIL_USER=john.doe@outlook.com

# Custom SMTP - có thể chỉ username
MAIL_USER=john.doe
```

---

### 5. MAIL_PASSWORD

**Mô tả**: Mật khẩu dùng để xác thực với SMTP server

**Các loại mật khẩu**:

1. **App Password** (Gmail - Khuyến nghị)
2. **Account Password** (Không khuyến nghị vì kém an toàn)
3. **API Key** (với một số dịch vụ như SendGrid)

**Với Gmail - App Password**:

- Định dạng: 16 ký tự, không có dấu cách
- Tạo tại: https://myaccount.google.com/apppasswords
- Phải bật xác thực 2 bước trước

**Quy tắc nhập vào .env**:

```
App Password từ Gmail: abcd efgh ijkl mnop
Nhập vào .env: abcd efgh ijkl mnop  ❌ SAI (có dấu cách)
Nhập vào .env: abcdefghijklmnop      ✅ ĐÚNG (bỏ dấu cách)
```

**Ví dụ cấu hình**:

```env
# Gmail App Password (khuyến nghị)
MAIL_PASSWORD=abcdefghijklmnop

# SendGrid API Key
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Mailgun API Key
MAIL_PASSWORD=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ Lưu ý bảo mật**:

- App Password chỉ hiển thị 1 lần duy nhất
- Không chia sẻ App Password với ai
- Mỗi môi trường nên có App Password riêng
- Nếu nghi ngờ bị lộ, xóa và tạo mới ngay

---

### 6. MAIL_FROM

**Mô tả**: Địa chỉ email hiển thị là người gửi

**Mặc định**: `noreply@rentalapp.com`

**Format**:

- Chỉ email: `user@example.com`
- Với tên: `"John Doe" <user@example.com>`

**Lưu ý**:

- Có thể khác với `MAIL_USER`
- Email này phải được phép gửi bởi SMTP server
- Một số SMTP server (như SendGrid) yêu cầu verify domain

**Ví dụ cấu hình**:

```env
# Email đơn giản
MAIL_FROM=noreply@rentalapp.com

# Email với tên hiển thị
MAIL_FROM="Rental App" <noreply@rentalapp.com>

# Email professional
MAIL_FROM=support@rentalapp.com

# Khác với MAIL_USER
MAIL_USER=admin@gmail.com
MAIL_FROM=noreply@rentalapp.com
```

**Lưu ý đặc biệt**:

- Với Gmail: `MAIL_FROM` thường giống `MAIL_USER`
- Với SMTP server cho phép: `MAIL_FROM` có thể là domain riêng

---

## 🔧 Cấu Hình Theo Nhà Cung Cấp

### 📧 Gmail (Google)

**Cấu hình khuyến nghị**:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=noreply@rentalapp.com
```

**Hoặc dùng SSL**:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=noreply@rentalapp.com
```

**Cách setup App Password**:

1. Bật xác thực 2 bước: https://myaccount.google.com/security
2. Tạo App Password: https://myaccount.google.com/apppasswords
3. Copy mã 16 ký tự (bỏ dấu cách) vào `MAIL_PASSWORD`

---

### 📧 Outlook/Hotmail (Microsoft)

**Cấu hình**:

```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_FROM=your-email@outlook.com
```

**Lưu ý**:

- Cần bật "Less secure app access" (không khuyến nghị)
- Hoặc dùng App Password tương tự Gmail

---

### 📧 Yahoo Mail

**Cấu hình**:

```env
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@yahoo.com
MAIL_PASSWORD=app-password
MAIL_FROM=your-email@yahoo.com
```

**Lưu ý**: Cần tạo App Password giống Gmail

---

### 📧 SendGrid

**Cấu hình**:

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=apikey
MAIL_PASSWORD=SG.your-api-key-here
MAIL_FROM=verified@yourdomain.com
```

**Lưu ý**:

- `MAIL_USER` luôn là `apikey`
- `MAIL_PASSWORD` là API key bắt đầu với `SG.`
- `MAIL_FROM` phải là email đã verify domain

---

### 📧 Mailgun

**Cấu hình**:

```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=postmaster@yourdomain.com
MAIL_PASSWORD=your-mailgun-password
MAIL_FROM=noreply@yourdomain.com
```

---

### 📧 Custom SMTP Server

**Cấu hình**:

```env
MAIL_HOST=mail.yourcompany.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=admin@yourcompany.com
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@yourcompany.com
```

---

## 📝 File .env Example Hoàn Chỉnh

### Định Dạng Đầy Đủ:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3000
GLOBAL_PREFIX=api

# ============================================
# JWT CONFIGURATION
# ============================================
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d

# ============================================
# FRONTEND URL
# ============================================
FRONTEND_URL=http://localhost:3000

# ============================================
# MAIL CONFIGURATION (Gmail)
# ============================================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop
MAIL_FROM=noreply@rentalapp.com
```

---

## 🔒 Bảo Mật

### Những gì PHẢI làm:

1. ✅ Tạo file `.env` từ `.env.example`
2. ✅ Điền thông tin thực tế vào `.env`
3. ✅ File `.env` đã được ignore bởi Git
4. ✅ Sử dụng App Password cho Gmail
5. ✅ Rotate mật khẩu định kỳ
6. ✅ Mỗi môi trường có file `.env` riêng

### Những gì KHÔNG ĐƯỢC làm:

1. ❌ Commit file `.env` vào Git
2. ❌ Dùng mật khẩu thông thường (không phải App Password)
3. ❌ Chia sẻ file `.env` qua email/slack
4. ❌ Sử dụng App Password ở nhiều môi trường
5. ❌ Lưu mật khẩu dạng plain text trong code

---

## 🧪 Test Kết Nối

### Chạy ứng dụng:

```bash
cd backend
pnpm run start:dev
```

### Kiểm tra log:

- ✅ Thành công: Không có lỗi kết nối SMTP
- ❌ Lỗi: "Invalid login" → Sai mật khẩu
- ❌ Lỗi: "Connection timeout" → Port/firewall issue
- ❌ Lỗi: "Authentication failed" → Sai cấu hình

---

## ❌ Xử Lý Lỗi Phổ Biến

### Lỗi: "Invalid login"

**Nguyên nhân**:

- Dùng mật khẩu thay vì App Password
- App Password sai hoặc đã expire

**Giải pháp**:

```bash
# Tạo lại App Password tại:
# https://myaccount.google.com/apppasswords
# Bỏ tất cả dấu cách khi nhập
```

---

### Lỗi: "Connection timeout"

**Nguyên nhân**:

- Port bị firewall block
- Network không cho phép SMTP

**Giải pháp**:

```bash
# Thử port khác
MAIL_PORT=465
MAIL_SECURE=true

# Hoặc thử port alternative
MAIL_PORT=2525
```

---

### Lỗi: "STARTTLS failed"

**Nguyên nhân**:

- `MAIL_SECURE` không khớp với port

**Giải pháp**:

```bash
# Port 587 → MAIL_SECURE=false
# Port 465 → MAIL_SECURE=true
```

---

## 📊 Bảng So Sánh Cấu Hình

### Port và Secure Flag

| Nhà cung cấp | Port | MAIL_SECURE | Kết nối |
| ------------ | ---- | ----------- | ------- |
| Gmail        | 587  | `false`     | TLS     |
| Gmail        | 465  | `true`      | SSL     |
| Outlook      | 587  | `false`     | TLS     |
| SendGrid     | 587  | `false`     | TLS     |
| Custom       | 587  | `false`     | TLS     |

---

## 📚 Tài Liệu Tham Khảo

### NestJS Mailer

- Documentation: https://docs.nestjs.com/techniques/email

### Gmail SMTP

- Official Guide: https://support.google.com/mail/answer/7126229
- App Passwords: https://support.google.com/accounts/answer/185833

### SendGrid

- SMTP Settings: https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp

### Mailgun

- SMTP Settings: https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp

---

## ✅ Checklist Setup

Trước khi deploy:

- [ ] Đã tạo file `.env` từ `.env.example`
- [ ] Đã bật xác thực 2 bước (Gmail)
- [ ] Đã tạo App Password
- [ ] Đã copy App Password vào file `.env` (bỏ dấu cách)
- [ ] Đã cấu hình `MAIL_SECURE` đúng với port
- [ ] File `.env` không bị commit vào Git
- [ ] Đã test gửi email thành công
- [ ] Đã test ở môi trường development
- [ ] Sẵn sàng deploy production

---

**Chúc bạn setup thành công! 🚀**

_Lưu ý: File này được tạo tự động. Hãy cập nhật thông tin mới nhất khi cần._
