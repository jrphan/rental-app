# 📧 Cấu Hình Resend Email Service

## Tại sao chuyển sang Resend?

- ✅ **Không bị block ports**: Resend dùng HTTPS API, không cần SMTP ports bị Render block
- ✅ **Miễn phí**: 3,000 emails/tháng, 100 emails/ngày
- ✅ **Nhanh**: API hiện đại, deliverability cao
- ✅ **Dễ debug**: Dashboard xem logs và status emails

---

## 📋 Bước 1: Tạo API Key

1. Truy cập: https://resend.com/signup
2. Đăng ký tài khoản (dùng Google hoặc email)
3. Vào Dashboard → **API Keys** → **Create API Key**
4. Đặt tên: `rental-app-prod` hoặc `rental-app-dev`
5. Chọn quyền: **Full access** hoặc **Sending access**
6. ⚠️ **Copy API key ngay** (chỉ hiển thị 1 lần)

API key có dạng: `re_123456789abcdefghijklmnopqrstuvwxyz`

---

## 📋 Bước 2: Setup Domain (Khuyến nghị)

### Option A: Dùng domain đã verify (Production)

1. Vào Dashboard → **Domains** → **Add Domain**
2. Nhập domain: `yourdomain.com`
3. Thêm DNS records mà Resend cung cấp:
   - SPF record (TXT)
   - DKIM record (TXT)
   - MX record (nếu cần)
4. Click **Verify** sau khi DNS propagate (5-30 phút)
5. Thêm vào `.env`:

```env
MAIL_FROM=noreply@yourdomain.com
```

### Option B: Dùng domain mặc định (Development)

Chưa verify domain? Resend cung cấp domain tạm:

```
onboarding@resend.dev
```

⚠️ **Lưu ý**: Email từ domain này có thể bị gán vào spam. Khuyến nghị verify domain cho production.

Thêm vào `.env`:

```env
MAIL_FROM=onboarding@resend.dev
```

---

## 📋 Bước 3: Thêm Biến Môi Trường

### Local development (.env)

```env
# Resend API Key (từ bước 1)
RESEND_API_KEY=re_123456789abcdefghijklmnopqrstuvwxyz

# From email (phải được verify trong Resend)
MAIL_FROM=noreply@yourdomain.com

# Optional: Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Render.com Environment Variables

1. Vào Render Dashboard → **Environment** tab
2. Thêm:
   - `RESEND_API_KEY` = API key từ bước 1
   - `MAIL_FROM` = email từ bước 2
   - `FRONTEND_URL` = URL frontend của bạn

---

## 📋 Bước 4: Test Email

Sau khi deploy, kiểm tra logs:

```bash
# Xem logs backend trên Render
```

Hoặc test ngay trong Resend Dashboard:

- Vào **Logs** tab để xem tất cả emails đã gửi
- Check delivery status: Sent, Delivered, Bounced

---

## ✅ Checklist

- [ ] Đăng ký tài khoản Resend
- [ ] Tạo API key và copy
- [ ] (Optional) Add & verify domain
- [ ] Thêm `RESEND_API_KEY` vào `.env` local
- [ ] Thêm `RESEND_API_KEY` vào Render environment variables
- [ ] Thêm `MAIL_FROM` vào cả hai
- [ ] Deploy backend lên Render
- [ ] Test gửi email (register user, forgot password, etc.)

---

## 🔍 Debugging

### Email không gửi được?

1. Check logs backend trên Render
2. Vào Resend Dashboard → **Logs** để xem chi tiết lỗi
3. Common errors:
   - `Unauthorized` → Sai API key
   - `Invalid "from" address` → Email chưa verify domain
   - `Rate limit` → Quá 100 emails/ngày (free plan)

### Xem chi tiết email:

Resend Dashboard → **Logs** → Click vào email để xem:

- Delivery status
- Open rate (nếu có tracking)
- Bounce reason (nếu failed)

---

## 💰 Pricing

**Free Plan:**

- 3,000 emails/tháng
- 100 emails/ngày
- Unlimited domains
- Email logs & analytics

**Paid Plan ($20/tháng):**

- 50,000 emails/tháng
- Advanced analytics
- Priority support

[Full pricing: https://resend.com/pricing](https://resend.com/pricing)

---

## 📚 Tài Liệu Tham Khảo

- Resend Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference
- Node.js SDK: https://resend.com/docs/send-with-nodejs
