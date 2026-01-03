📌 NGHIỆP VỤ TÍNH GIÁ THUÊ XE & DOANH THU NỀN TẢNG

### 1. Các khoản chi phí trong hệ thống
Khoản	           |     Mô tả
Giá thuê/ngày	  |     Giá thuê xe theo ngày do chủ xe thiết lập
Phí giao xe	     |     Phí giao xe tận nơi (10.000 VNĐ/km – hệ thống quy định)
Giảm giá	        |     Mã khuyến mãi do nền tảng cung cấp
Phí bảo hiểm	  |     Dịch vụ bảo hiểm tự nguyện cho người thuê
Phí nền tảng	  |     Phí dịch vụ hệ thống thu từ chủ xe
Tiền cọc	        |     Khoản tiền đảm bảo, hoàn trả sau khi kết thúc thuê

### 2. Quy tắc tính thời gian thuê

Thời gian thuê được tính theo số ngày, làm tròn lên:

durationDays = ceil(durationMinutes / (60 × 24))

### 3. Quy tắc phân bổ dòng tiền

## 🔹 Chủ xe nhận:

- Tiền thuê xe gốc

- Phí giao xe (nếu có)

## 🔹 Nền tảng (Admin) nhận:

- Phí nền tảng

- Hoa hồng bảo hiểm

- Chịu toàn bộ chi phí giảm giá

## 🔹 Phí bảo hiểm:

- Là dịch vụ bổ sung

- Nền tảng thu hộ

- Chỉ phần hoa hồng bảo hiểm là doanh thu nền tảng

## 🔹 Tiền cọc:

- Không tính vào doanh thu

- Hoàn trả sau khi kết thúc thuê

### 4. Công thức tính giá

## a. Giá thuê gốc
baseRental = pricePerDay × durationDays

## b. Tổng tiền người thuê trả
totalPrice = baseRental + deliveryFee + insuranceFee - discountAmount

* Đây là số tiền khách thanh toán, không phản ánh doanh thu của từng bên.

## c. Phí nền tảng
platformFee = baseRental × platformFeeRatio

## d. Thu nhập chủ xe
ownerEarning = baseRental - platformFee + deliveryFee

✔ Giảm giá không ảnh hưởng thu nhập chủ xe
✔ Bảo hiểm không thuộc thu nhập chủ xe

## e. Doanh thu nền tảng (CHUẨN HÓA)
platformEarning = platformFee - discountAmount + insuranceCommissionAmount

📌 Giải thích:

- platformFee: thu từ chủ xe

- discountAmount: chi phí marketing

- insuranceCommissionAmount: hoa hồng bảo hiểm được hưởng

## Bonus. Tiền chủ xe nhận từ khách thuê và cần hoàn trả cho Platform (không phải doanh thu) 
refundToPlatform = totalPrice - ownerEarning = platformFee - discountAmount + insuranceFee

<!-- BẢO HIỂM -->

### 5. Insurance Fee & Insurance Commission (Đối soát bảo hiểm)

## 5.1 Khái niệm

- insuranceFee: tổng phí bảo hiểm người thuê trả

- insuranceCommissionRatio: % hoa hồng nền tảng

- insuranceCommissionAmount: tiền hoa hồng nền tảng

- insurancePayableToPartner: tiền phải trả đối tác bảo hiểm

## 5.2 Nguyên tắc nghiệp vụ

- Phí bảo hiểm không phải doanh thu chủ xe

- Nền tảng chỉ hưởng hoa hồng

- Hoa hồng tính theo từng đơn thuê

- Giá trị chốt tại thời điểm tạo đơn

## 5.3 Công thức tính bảo hiểm cho một đơn
insuranceCommissionAmount = insuranceFee × insuranceCommissionRatio
insurancePayableToPartner = insuranceFee - insuranceCommissionAmount

## Ví dụ
Thông tin	                  |     Giá trị
insuranceFee	               |     60.000
insuranceCommissionRatio	   |     20%
insuranceCommissionAmount	   |     12.000
insurancePayableToPartner	   |     48.000

### 6. Lưu trữ dữ liệu (RẤT QUAN TRỌNG)

Mỗi đơn thuê (Rental) cần lưu:

- insuranceFee

- insuranceCommissionRatio

- insuranceCommissionAmount

- insurancePayableToPartner

👉 Tránh thay đổi chính sách ảnh hưởng dữ liệu cũ
👉 Phù hợp nghiệp vụ kế toán – đối soát

### 7. Đối soát cuối kỳ

## 7.1 Doanh thu bảo hiểm nền tảng
SUM(insuranceCommissionAmount)

## 7.2 Thanh toán cho đối tác bảo hiểm
SUM(insurancePayableToPartner)

### 8. Tóm tắt luồng tiền bảo hiểm
Người thuê
   ↓
insuranceFee
   ↓
Nền tảng (thu hộ)
   ├─ insuranceCommissionAmount  → Doanh thu nền tảng
   └─ insurancePayableToPartner → Đối tác bảo hiểm

### 9. Kết luận

## Hệ thống tách bạch rõ:

- Doanh thu chủ xe

- Doanh thu nền tảng

- Khoản thu hộ bảo hiểm

## Đảm bảo:

- Minh bạch dòng tiền

- Dễ mở rộng

- Phù hợp nghiệp vụ thực tế
