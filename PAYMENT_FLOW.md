# Tài liệu Kỹ thuật: Luồng Thanh toán P2P (Escrow) với Stripe Connect

Tài liệu này mô tả chi tiết luồng thanh toán cho ứng dụng cho thuê xe P2P, sử dụng **Stripe Connect** làm nền tảng. Mô hình này là mô hình **Escrow (Trung gian giữ tiền)**, sử dụng phương thức **"Separate Charges and Transfers"** (Thu tiền riêng và Chuyển tiền riêng) của Stripe - đây là mô hình linh hoạt và phù hợp nhất cho P2P.

---

## Mục lục

1. [Thuật ngữ Stripe Chính](#1-thuật-ngữ-stripe-chính)
2. [Luồng 1: Onboarding Chủ xe (Owner)](#2-luồng-1-onboarding-chủ-xe-owner)
3. [Luồng 2: Renter Thanh toán (Payment & Escrow)](#3-luồng-2-renter-thanh-toán-payment--escrow)
4. [Luồng 3: Hoàn tất & Chia tiền (Split & Payout)](#4-luồng-3-hoàn-tất--chia-tiền-split--payout)
5. [Luồng 4: Xử lý Tranh chấp (Disputes)](#5-luồng-4-xử-lý-tranh-chấp-disputes)
6. [Cấu trúc Database Cần Bổ Sung](#6-cấu-trúc-database-cần-bổ-sung)
7. [API Endpoints](#7-api-endpoints)
8. [Webhook Handling](#8-webhook-handling)
9. [Error Handling & Edge Cases](#9-error-handling--edge-cases)

---

## 1. Thuật ngữ Stripe Chính

### 1.1 Platform (Nền tảng)

- **Định nghĩa**: Là bạn (Ứng dụng Rental App)
- **Tài khoản**: Tài khoản Stripe chính của bạn (Platform Account)
- **Vai trò**: Nhận và "giữ" tiền (Escrow) trong ví (Balance) của Platform cho đến khi chuyến đi hoàn tất

### 1.2 Connected Account (Tài khoản Kết nối)

- **Định nghĩa**: Là tài khoản Stripe "con" đại diện cho mỗi Owner (Chủ xe)
- **Loại**: `express` (Khuyến nghị - Stripe cung cấp trang onboarding đẹp mắt)
- **Vai trò**: Stripe tự động quản lý việc xác thực (KYC) và rút tiền (Payout) cho Owner về ngân hàng của họ

### 1.3 PaymentIntent

- **Định nghĩa**: Một giao dịch thanh toán từ Renter (ví dụ: Renter trả 1.500.000đ)
- **Lưu trữ**: Lưu `paymentIntentId` vào `Payment.transactionId` trong database
- **Status**: `requires_payment_method` → `requires_confirmation` → `succeeded` / `failed`

### 1.4 Transfer (Chuyển tiền)

- **Định nghĩa**: Lệnh chuyển tiền từ Platform Balance đến Connected Account của Owner
- **Thời điểm**: Sau khi chuyến đi hoàn tất (COMPLETED)
- **Kết quả**: Tiền vào ví Stripe của Owner, Stripe tự động Payout về ngân hàng

### 1.5 Refund (Hoàn tiền)

- **Định nghĩa**: Lệnh trả lại tiền (một phần hoặc toàn bộ) cho Renter
- **Sử dụng**:
  - Hoàn tiền cọc sau khi hoàn tất chuyến đi
  - Hoàn tiền cọc một phần khi có tranh chấp

### 1.6 Escrow (Ví tạm)

- **Định nghĩa**: Tiền của Renter sẽ nằm trong ví (Balance) của Platform cho đến khi chuyến đi hoàn tất
- **Bảo vệ**: Bảo vệ cả Renter (không mất tiền nếu Owner không giao xe) và Owner (đảm bảo được thanh toán)

---

## 2. Luồng 1: Onboarding Chủ xe (Owner)

### 2.1 Mục tiêu

Tạo một Connected Account cho mỗi Owner để họ có thể nhận tiền từ Platform.

### 2.2 Kích hoạt (Trigger)

Người dùng được Admin duyệt `OwnerApplication` (trạng thái → `APPROVED`) và `User.role` được cập nhật thành `OWNER`.

### 2.3 Quy trình chi tiết

#### Bước 1: Tạo Connected Account (Backend - NestJS)

**Khi nào**: Sau khi Admin approve OwnerApplication

**API Stripe**:

```typescript
const account = await stripe.accounts.create({
  type: "express",
  country: "VN", // Hoặc country code tùy theo Owner
  email: owner.email,
  capabilities: {
    transfers: { requested: true },
  },
});
```

**Lưu trữ**:

- Lưu `account.id` (ví dụ: `acct_...`) vào `User.stripeAccountId` trong database
- **Lưu ý**: Cần thêm field `stripeAccountId` vào User model

#### Bước 2: Tạo Account Link (Backend - NestJS)

**API Stripe**:

```typescript
const accountLink = await stripe.accountLinks.create({
  account: stripeAccountId,
  refresh_url: `${FRONTEND_URL}/owner/onboarding?refresh=true`,
  return_url: `${FRONTEND_URL}/owner/onboarding?success=true`,
  type: "account_onboarding",
});
```

**Trả về**: `accountLink.url` cho Frontend

#### Bước 3: Mở WebView (Frontend - React Native)

1. Backend trả về `url` từ Account Link
2. Frontend mở WebView (hoặc trình duyệt) đến `url` này
3. Owner sẽ thấy trang onboarding của Stripe, yêu cầu:
   - Thông tin cá nhân
   - Thông tin tài khoản ngân hàng
   - Xác thực KYC (nếu cần)
4. Stripe tự xử lý toàn bộ quá trình xác thực

#### Bước 4: Hoàn tất

- Sau khi Owner hoàn tất, Stripe chuyển hướng về `return_url`
- Backend có thể kiểm tra trạng thái account:
  ```typescript
  const account = await stripe.accounts.retrieve(stripeAccountId);
  // account.details_submitted === true nghĩa là đã hoàn tất
  ```
- Owner đã sẵn sàng nhận tiền

### 2.4 Lưu ý

- Onboarding chỉ cần thực hiện **1 lần** cho mỗi Owner
- Nếu Owner chưa hoàn tất (details_submitted = false), có thể tạo lại Account Link
- Stripe tự động xử lý KYC và yêu cầu bổ sung nếu cần

---

## 3. Luồng 2: Renter Thanh toán (Payment & Escrow)

### 3.1 Mục tiêu

Thu tiền từ Renter và "giữ" (Escrow) tại tài khoản Balance của Platform.

### 3.2 Kích hoạt

Renter nhấn **"Xác nhận Thanh toán"** sau khi:

1. Owner đã duyệt đơn thuê (`Rental.status = CONFIRMED`)
2. Renter đã xem chi tiết tổng tiền (tiền thuê + tiền cọc)

### 3.3 Quy trình chi tiết

#### Bước 1: Tính toán tổng tiền (Backend - NestJS)

**Lưu ý quan trọng**:

- Trong `Rental` model, `totalAmount` = `subtotal` + `serviceFee` (KHÔNG bao gồm deposit)
- Đối với PaymentIntent, cần thu **cả subtotal và deposit** từ Renter
- Phí dịch vụ KHÔNG thu từ Renter, mà được trừ từ tiền Owner nhận

**Công thức**:

```typescript
// Lấy dữ liệu từ Rental
const rental = await prisma.rental.findUnique({ where: { id: rentalId } });

// PaymentIntent amount = subtotal + depositAmount (KHÔNG bao gồm serviceFee)
const paymentIntentAmount =
  Number(rental.subtotal) + Number(rental.depositAmount);
// Ví dụ: 500.000đ + 1.000.000đ = 1.500.000đ

// Service fee sẽ được tính sau khi hoàn tất (trừ từ tiền Owner nhận)
// Ví dụ: 500.000đ × 15% = 75.000đ
```

**Lưu ý**:

- Tiền cọc sẽ được giữ trong Escrow và hoàn trả sau khi hoàn tất (trừ khi có tranh chấp)
- Phí dịch vụ được trừ từ tiền Owner nhận, không phải từ tiền Renter trả

#### Bước 2: Tạo PaymentIntent (Backend - NestJS)

**API Stripe**:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: paymentIntentAmount * 100, // Stripe tính bằng đơn vị nhỏ nhất (1.5tr VNĐ = 150000000)
  currency: "vnd", // hoặc 'usd' tùy theo yêu cầu
  payment_method_types: ["card"],
  metadata: {
    rentalId: rental.id,
    renterId: renter.id,
    ownerId: rental.ownerId,
    type: "rental_payment", // Để phân biệt loại thanh toán
  },
});
```

**Lưu trữ**:

- Tạo record `Payment` trong database:
  ```typescript
  await prisma.payment.create({
    data: {
      rentalId: rental.id,
      userId: renter.id,
      amount: paymentIntentAmount, // subtotal + depositAmount
      currency: "VND",
      paymentMethod: "CREDIT_CARD", // hoặc DEBIT_CARD
      status: "PENDING",
      transactionId: paymentIntent.id, // Lưu PaymentIntent ID
      gateway: "STRIPE",
      gatewayData: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    },
  });
  ```

#### Bước 3: Trả về Client Secret (Backend → Frontend)

**Response**:

```json
{
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "amount": 1500000,
  "currency": "vnd"
}
```

#### Bước 4: Hiển thị Payment Sheet (Frontend - React Native)

**Sử dụng Stripe SDK**:

```typescript
import { useStripe } from "@stripe/stripe-react-native";

// Sử dụng clientSecret để hiển thị Payment Sheet
const { initPaymentSheet, presentPaymentSheet } = useStripe();

// Initialize
await initPaymentSheet({
  paymentIntentClientSecret: clientSecret,
  merchantDisplayName: "Rental App",
});

// Present
const { error } = await presentPaymentSheet();
```

**Flow**:

1. Renter nhập thông tin thẻ (số thẻ, CVV, ngày hết hạn)
2. Renter xác nhận thanh toán
3. Stripe xử lý thanh toán

#### Bước 5: Xử lý Webhook (Stripe → Backend)

**Khi thanh toán thành công**, Stripe gọi webhook đến endpoint:

```
POST /stripe/webhook
```

**Event**: `payment_intent.succeeded`

**Xử lý**:

```typescript
// 1. Xác thực webhook signature
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers["stripe-signature"],
  process.env.STRIPE_WEBHOOK_SECRET
);

// 2. Xử lý event
if (event.type === "payment_intent.succeeded") {
  const paymentIntent = event.data.object;

  // 3. Cập nhật Payment status
  await prisma.payment.update({
    where: { transactionId: paymentIntent.id },
    data: { status: "COMPLETED" },
  });

  // 4. Cập nhật Rental status
  await prisma.rental.update({
    where: { id: rentalId },
    data: { status: "CONFIRMED" },
  });

  // 5. Gửi thông báo
  await notificationService.sendToBoth(
    renterId,
    ownerId,
    "PAYMENT_SUCCESS",
    "Chuyến đi đã được xác nhận!"
  );
}
```

**Kết quả**:

- Tiền (1.500.000đ) được chuyển vào ví (Balance) của Platform
- `Rental.status` → `CONFIRMED`
- `Payment.status` → `COMPLETED`
- Cả Renter và Owner nhận thông báo

### 3.4 Lưu ý

- Tiền cọc **KHÔNG** được chuyển cho Owner ngay lập tức
- Tiền được giữ trong Escrow (Platform Balance) cho đến khi hoàn tất
- Nếu thanh toán thất bại, `Payment.status` → `FAILED` và `Rental.status` vẫn là `PENDING`

---

## 4. Luồng 3: Hoàn tất & Chia tiền (Split & Payout)

### 4.1 Mục tiêu

Chia tiền từ ví tạm (Platform Balance) cho Owner, hoàn cọc cho Renter, và giữ lại phí dịch vụ.

### 4.2 Kích hoạt

Renter và Owner hoàn tất Check-out. `Rental.status` → `COMPLETED`.

**Điều kiện**:

- Cả Renter và Owner đều xác nhận hoàn tất chuyến đi
- Hoặc hệ thống tự động chuyển sang `COMPLETED` sau `endDate` + thời gian buffer

### 4.3 Quy trình chi tiết

#### Bước 1: Tính toán chia tiền (Backend - NestJS)

**Lưu ý**: Service fee được tính và lưu trong `Rental.serviceFee` khi tạo rental. Tỷ lệ phí dịch vụ có thể cấu hình (ví dụ: 10%, 15%).

**Dữ liệu từ Rental**:

```typescript
const rental = await prisma.rental.findUnique({ where: { id: rentalId } });

// Dữ liệu:
const subtotal = Number(rental.subtotal); // 500.000đ - Tiền thuê xe
const depositAmount = Number(rental.depositAmount); // 1.000.000đ - Tiền cọc
const serviceFee = Number(rental.serviceFee); // 75.000đ - Phí dịch vụ (đã tính khi tạo rental)
```

**Tính toán**:

```typescript
// Tiền cọc hoàn trả Renter (toàn bộ)
const refundAmount = depositAmount; // 1.000.000đ

// Tiền Owner thực nhận (tiền thuê - phí dịch vụ)
const ownerAmount = subtotal - serviceFee; // 500.000 - 75.000 = 425.000đ

// Phí dịch vụ Platform giữ lại (đã có trong serviceFee)
const platformFee = serviceFee; // 75.000đ
```

**Kết quả**:

- Renter nhận lại: **1.000.000đ** (tiền cọc)
- Owner nhận: **425.000đ** (tiền thuê - phí dịch vụ)
- Platform giữ: **75.000đ** (phí dịch vụ)

#### Bước 2: Hoàn cọc cho Renter (Backend - NestJS)

**API Stripe**:

```typescript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId, // ID từ Payment transactionId
  amount: refundAmount * 100, // 100000000 (1.000.000đ)
  reason: "requested_by_customer",
  metadata: {
    rentalId: rental.id,
    type: "deposit_refund",
  },
});
```

**Lưu trữ**:

- Tạo record `Payment` mới với `status = REFUNDED`:
  ```typescript
  await prisma.payment.create({
    data: {
      rentalId: rental.id,
      userId: renter.id,
      amount: refundAmount,
      currency: "VND",
      paymentMethod: "CREDIT_CARD", // Giống payment method gốc
      status: "REFUNDED",
      transactionId: refund.id,
      gateway: "STRIPE",
      gatewayData: {
        refundId: refund.id,
        paymentIntentId: paymentIntentId,
        type: "deposit_refund",
      },
      description: "Hoàn tiền cọc",
    },
  });
  ```

**Kết quả**: Renter nhận lại 1.000.000đ vào thẻ đã thanh toán

#### Bước 3: Chuyển tiền cho Owner (Backend - NestJS)

**Điều kiện**:

- Owner phải có `stripeAccountId` và đã hoàn tất onboarding (`details_submitted = true`)

**API Stripe**:

```typescript
const transfer = await stripe.transfers.create({
  amount: ownerAmount * 100, // 42500000 (425.000đ)
  currency: "vnd",
  destination: owner.stripeAccountId, // Connected Account ID
  metadata: {
    rentalId: rental.id,
    type: "rental_payout",
  },
});
```

**Lưu trữ**:

- Tạo record `Payment` mới:
  ```typescript
  await prisma.payment.create({
    data: {
      rentalId: rental.id,
      userId: owner.id,
      amount: ownerAmount,
      currency: "VND",
      paymentMethod: "BANK_TRANSFER", // Loại này để phân biệt
      status: "COMPLETED",
      transactionId: transfer.id,
      gateway: "STRIPE",
      gatewayData: {
        transferId: transfer.id,
        type: "rental_payout",
      },
      description: "Thanh toán tiền thuê xe",
    },
  });
  ```

**Kết quả**:

- 425.000đ vào ví Stripe Connected của Owner
- Stripe tự động Payout về ngân hàng của Owner (theo lịch payout của Stripe, thường 2-7 ngày)

#### Bước 4: Gửi thông báo (Backend - NestJS)

```typescript
// Thông báo cho Renter
await notificationService.send(
  renterId,
  "PAYMENT_SUCCESS",
  "Bạn đã nhận lại tiền cọc 1.000.000đ"
);

// Thông báo cho Owner
await notificationService.send(
  ownerId,
  "PAYMENT_SUCCESS",
  "Bạn đã nhận 425.000đ tiền thuê xe. Tiền sẽ được chuyển về ngân hàng trong 2-7 ngày."
);
```

### 4.4 Lưu ý

- **Idempotency**: Cần sử dụng idempotency key để tránh duplicate refund/transfer
- **Error Handling**: Nếu transfer thất bại, cần retry logic hoặc thông báo Admin
- **Phí dịch vụ**: 75.000đ tự động giữ lại trong Platform Balance, không cần action gì thêm
- **Timing**: Có thể chạy job này tự động hoặc manual trigger từ Admin

---

## 5. Luồng 4: Xử lý Tranh chấp (Disputes)

### 5.1 Mục tiêu

Xử lý khi Renter làm hỏng xe hoặc có tranh chấp, sử dụng tiền cọc để bồi thường.

### 5.2 Kích hoạt

Admin duyệt Dispute, quyết định phạt Renter một số tiền từ tiền cọc.

**Ví dụ**: Admin quyết định phạt Renter **300.000đ** từ tiền cọc 1.000.000đ.

### 5.3 Quy trình chi tiết

#### Bước 1: Tính toán (Backend - NestJS)

**Dữ liệu**:

```typescript
const depositAmount = 1000000; // Tổng cọc
const penaltyAmount = 300000; // Tiền phạt (Admin quyết định)
```

**Tính toán**:

```typescript
// Tiền phạt chuyển cho Owner
const ownerCompensation = penaltyAmount; // 300.000đ

// Tiền cọc hoàn lại Renter (còn lại)
const renterRefund = depositAmount - penaltyAmount; // 700.000đ
```

**Kết quả**:

- Renter nhận lại: **700.000đ** (tiền cọc còn lại)
- Owner nhận: **300.000đ** (tiền bồi thường)
- Platform: Không thay đổi (phí dịch vụ vẫn giữ như bình thường)

#### Bước 2: Hoàn tiền cọc một phần cho Renter (Backend - NestJS)

**API Stripe**:

```typescript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: renterRefund * 100, // 70000000 (700.000đ)
  reason: "requested_by_customer",
  metadata: {
    rentalId: rental.id,
    type: "partial_deposit_refund",
    disputeId: dispute.id,
  },
});
```

**Lưu trữ**: Tương tự như Luồng 3, nhưng với `amount = 700.000đ`

#### Bước 3: Chuyển tiền bồi thường cho Owner (Backend - NestJS)

**API Stripe**:

```typescript
const transfer = await stripe.transfers.create({
  amount: ownerCompensation * 100, // 30000000 (300.000đ)
  currency: "vnd",
  destination: owner.stripeAccountId,
  metadata: {
    rentalId: rental.id,
    type: "dispute_compensation",
    disputeId: dispute.id,
  },
});
```

**Lưu trữ**: Tương tự như Luồng 3

#### Bước 4: Cập nhật trạng thái (Backend - NestJS)

```typescript
// Cập nhật Rental
await prisma.rental.update({
  where: { id: rental.id },
  data: { status: "DISPUTED" }, // Hoặc 'COMPLETED' tùy logic
});

// Cập nhật Dispute (nếu có model)
await prisma.dispute.update({
  where: { id: dispute.id },
  data: { status: "RESOLVED", resolvedAt: new Date() },
});
```

### 5.4 Lưu ý

- **Tiền thuê xe**: Vẫn được xử lý bình thường theo Luồng 3 (500.000đ - phí dịch vụ = 425.000đ cho Owner)
- **Partial Refund**: Stripe hỗ trợ hoàn tiền một phần, không cần hoàn toàn bộ
- **Documentation**: Cần lưu lại thông tin dispute và quyết định của Admin để audit

---

## 6. Cấu trúc Database Cần Bổ Sung

### 6.1 User Model - Thêm field

**Cần thêm vào `User` model**:

```prisma
model User {
  // ... các field hiện có
  stripeAccountId String? @unique // Connected Account ID
  stripeAccountStatus String? // 'active', 'restricted', 'pending'

  @@index([stripeAccountId])
}
```

**Migration**:

```sql
ALTER TABLE "users" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "users" ADD COLUMN "stripeAccountStatus" TEXT;
CREATE UNIQUE INDEX "users_stripeAccountId_key" ON "users"("stripeAccountId");
CREATE INDEX "users_stripeAccountId_idx" ON "users"("stripeAccountId");
```

### 6.2 Payment Model - Đã có sẵn

**Payment model hiện tại đã đủ**:

- `transactionId`: Lưu PaymentIntent ID hoặc Transfer ID
- `gatewayData`: Lưu JSON data (refundId, transferId, etc.)
- `status`: PENDING, COMPLETED, REFUNDED, FAILED

**Khuyến nghị**: Thêm field `type` để phân biệt loại payment:

```prisma
model Payment {
  // ... các field hiện có
  type PaymentType? // 'charge', 'refund', 'transfer', 'payout'
}

enum PaymentType {
  CHARGE      // Thanh toán từ Renter
  REFUND      // Hoàn tiền cho Renter
  TRANSFER    // Chuyển tiền cho Owner
  PAYOUT      // Payout từ Stripe (nếu cần track)
}
```

### 6.3 Rental Model - Đã có sẵn

**Rental model hiện tại đã đủ**, không cần thay đổi.

---

## 7. API Endpoints

### 7.1 Owner Onboarding

#### POST `/payments/stripe/onboard`

Tạo Connected Account và Account Link cho Owner.

**Request**:

```json
{
  "userId": "user_123"
}
```

**Response**:

```json
{
  "accountId": "acct_...",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

#### GET `/payments/stripe/onboard/status`

Kiểm tra trạng thái onboarding của Owner.

**Response**:

```json
{
  "accountId": "acct_...",
  "detailsSubmitted": true,
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

### 7.2 Payment

#### POST `/payments/stripe/create-intent`

Tạo PaymentIntent cho Rental.

**Request**:

```json
{
  "rentalId": "rental_123"
}
```

**Response**:

```json
{
  "paymentIntentId": "pi_...",
  "clientSecret": "pi_..._secret_...",
  "amount": 1500000,
  "currency": "vnd"
}
```

#### POST `/payments/stripe/confirm`

Xác nhận thanh toán (optional, có thể dùng webhook thay thế).

**Request**:

```json
{
  "paymentIntentId": "pi_..."
}
```

### 7.3 Refund & Transfer

#### POST `/payments/stripe/refund`

Hoàn tiền cho Renter.

**Request**:

```json
{
  "rentalId": "rental_123",
  "amount": 1000000,
  "reason": "deposit_refund"
}
```

#### POST `/payments/stripe/transfer`

Chuyển tiền cho Owner.

**Request**:

```json
{
  "rentalId": "rental_123",
  "ownerId": "owner_123",
  "amount": 425000,
  "reason": "rental_payout"
}
```

### 7.4 Webhook

#### POST `/stripe/webhook`

Nhận webhook từ Stripe.

**Headers**:

```
Stripe-Signature: ...
```

**Body**: Stripe event JSON

---

## 8. Webhook Handling

### 8.1 Events cần xử lý

| Event                           | Mô tả                      | Action                               |
| ------------------------------- | -------------------------- | ------------------------------------ |
| `payment_intent.succeeded`      | Thanh toán thành công      | Cập nhật Payment, Rental → CONFIRMED |
| `payment_intent.payment_failed` | Thanh toán thất bại        | Cập nhật Payment → FAILED            |
| `charge.refunded`               | Hoàn tiền thành công       | Cập nhật Payment → REFUNDED          |
| `transfer.created`              | Transfer thành công        | Cập nhật Payment → COMPLETED         |
| `transfer.failed`               | Transfer thất bại          | Thông báo Admin, retry logic         |
| `account.updated`               | Connected Account cập nhật | Cập nhật User.stripeAccountStatus    |

### 8.2 Webhook Security

**Xác thực signature**:

```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers["stripe-signature"],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

**Idempotency**:

- Sử dụng `event.id` để tránh xử lý duplicate events
- Lưu `event.id` vào database và check trước khi xử lý

---

## 9. Error Handling & Edge Cases

### 9.1 Thanh toán thất bại

**Scenario**: Renter thanh toán thất bại (thẻ không đủ tiền, thẻ bị khóa, etc.)

**Xử lý**:

- `Payment.status` → `FAILED`
- `Rental.status` vẫn là `PENDING`
- Thông báo cho Renter: "Thanh toán thất bại. Vui lòng thử lại hoặc dùng thẻ khác."
- Cho phép Renter tạo PaymentIntent mới

### 9.2 Refund thất bại

**Scenario**: Hoàn tiền cọc thất bại (thẻ đã bị hủy, account closed, etc.)

**Xử lý**:

- Log lỗi và thông báo Admin
- Có thể chuyển sang phương thức khác (manual refund, store credit, etc.)
- Owner vẫn nhận tiền bình thường

### 9.3 Transfer thất bại

**Scenario**: Chuyển tiền cho Owner thất bại (Connected Account bị restrict, etc.)

**Xử lý**:

- Retry logic (3 lần, exponential backoff)
- Nếu vẫn thất bại, thông báo Admin
- Owner có thể được yêu cầu cập nhật thông tin Connected Account
- Tiền vẫn giữ trong Platform Balance cho đến khi transfer thành công

### 9.4 Owner chưa hoàn tất Onboarding

**Scenario**: Owner chưa hoàn tất onboarding nhưng chuyến đi đã COMPLETED

**Xử lý**:

- Không thể transfer ngay
- Thông báo Owner: "Vui lòng hoàn tất thông tin thanh toán để nhận tiền"
- Tạo Account Link mới và gửi cho Owner
- Sau khi hoàn tất, tự động retry transfer

### 9.5 Dispute Resolution

**Scenario**: Admin cần thay đổi quyết định dispute sau khi đã refund/transfer

**Xử lý**:

- Không thể reverse refund/transfer tự động
- Cần tạo manual adjustment:
  - Nếu cần thu thêm tiền từ Renter: Tạo PaymentIntent mới
  - Nếu cần trả thêm cho Owner: Tạo Transfer mới
  - Nếu cần hoàn lại cho Renter: Tạo Refund mới

---

## 10. Testing Checklist

### 10.1 Owner Onboarding

- [ ] Tạo Connected Account thành công
- [ ] Tạo Account Link và mở WebView
- [ ] Owner hoàn tất onboarding
- [ ] Kiểm tra `details_submitted = true`

### 10.2 Payment Flow

- [ ] Tạo PaymentIntent thành công
- [ ] Hiển thị Payment Sheet trên mobile
- [ ] Thanh toán thành công
- [ ] Webhook `payment_intent.succeeded` được xử lý
- [ ] Payment và Rental status được cập nhật

### 10.3 Completion & Split

- [ ] Tính toán chia tiền chính xác
- [ ] Refund cọc cho Renter thành công
- [ ] Transfer tiền cho Owner thành công
- [ ] Platform fee được giữ lại đúng

### 10.4 Dispute Flow

- [ ] Partial refund cho Renter
- [ ] Transfer compensation cho Owner
- [ ] Dispute status được cập nhật

### 10.5 Error Cases

- [ ] Payment failure handling
- [ ] Refund failure handling
- [ ] Transfer failure handling
- [ ] Owner chưa onboard handling

---

## 11. Environment Variables

### 11.1 Backend (.env)

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URLs
FRONTEND_URL=https://your-app.com
MOBILE_APP_SCHEME=rentalapp://
```

### 11.2 Mobile (.env)

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 12. Tính toán Phí Dịch vụ

### 12.1 Công thức

```
Phí dịch vụ = subtotal × service_fee_percentage
Owner nhận = subtotal - phí dịch vụ
Platform giữ = phí dịch vụ
```

**Ví dụ**:

- Subtotal: 500.000đ
- Service fee: 15% (có thể cấu hình, hiện tại trong code là 10%)
- Phí dịch vụ: 500.000 × 15% = 75.000đ
- Owner nhận: 500.000 - 75.000 = 425.000đ

### 12.2 Lưu ý Quan trọng

- Phí dịch vụ chỉ tính trên **subtotal** (tiền thuê xe), **KHÔNG** tính trên deposit
- Deposit được hoàn trả toàn bộ (trừ khi có dispute)
- **Phí dịch vụ KHÔNG thu từ Renter**: Renter chỉ trả subtotal + deposit
- Phí dịch vụ được trừ từ tiền Owner nhận khi chia tiền
- PaymentIntent amount = subtotal + depositAmount (KHÔNG bao gồm serviceFee)

### 12.3 Tóm tắt Luồng Tiền

**Khi Renter thanh toán**:

- Renter trả: subtotal + deposit = 1.500.000đ (500k + 1mil)
- Tiền vào Platform Balance: 1.500.000đ

**Khi hoàn tất chuyến đi**:

- Renter nhận lại: deposit = 1.000.000đ (refund)
- Owner nhận: subtotal - serviceFee = 425.000đ (transfer)
- Platform giữ: serviceFee = 75.000đ (còn lại trong Balance)

**Khi có tranh chấp** (ví dụ phạt 300k):

- Renter nhận lại: deposit - penalty = 700.000đ (partial refund)
- Owner nhận: penalty = 300.000đ (transfer compensation)
- Tiền thuê xe (425k) vẫn được xử lý bình thường

---

## 13. Tài liệu Tham khảo

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Transfers](https://stripe.com/docs/connect/separate-charges-and-transfers)
- [Stripe Refunds](https://stripe.com/docs/refunds)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## 14. Changelog & Notes

### Version 1.0 (2024-10-XX)

- Initial documentation
- Escrow model với Separate Charges and Transfers
- 4 luồng chính: Onboarding, Payment, Completion, Dispute

### Notes

- Tài liệu này sẽ được cập nhật khi có thay đổi trong implementation
- Mọi thay đổi về business logic cần được review và update tài liệu

---

**Tác giả**: Development Team  
**Ngày cập nhật**: 2024-10-XX  
**Version**: 1.0
