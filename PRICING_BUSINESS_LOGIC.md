📌 NGHIỆP VỤ TÍNH GIÁ THUÊ XE

### 1. Các khoản chi phí trong hệ thống:

Khoản           |   Mô tả
Giá thuê/ngày   |   Giá thuê xe theo ngày do chủ xe thiết lập
Phí giao xe     |   Phí giao xe tận nơi, hệ thống quy định 10.000 VNĐ/km
Giảm giá        |   Mã khuyến mãi do nền tảng cung cấp
Phí bảo hiểm    |   Phí bảo hiểm tự nguyện cho người thuê
Phí nền tảng    |   Phí dịch vụ của hệ thống
Tiền cọc        |   Khoản tiền đảm bảo, hoàn trả sau khi kết thúc thuê

### 2. Quy tắc tính số ngày thuê:

Thời gian thuê được tính theo số ngày, làm tròn lên:

durationDays = ceil(số phút thuê / (60 × 24))

### 3. Quy tắc phân bổ dòng tiền:

## 🔹 Chủ xe nhận:

    - Tiền thuê xe gốc

    - Phí giao xe (nếu có)

## 🔹 Nền tảng (Admin) nhận:

    - Phí nền tảng (tính theo % tiền thuê)

    - Chịu toàn bộ chi phí giảm giá (nếu có)

## 🔹 Phí bảo hiểm:

    - Được thu hộ cho đối tác bảo hiểm

    - Không tính vào doanh thu nền tảng tại thời điểm tạo đơn

## 🔹 Tiền cọc:

    - Không tính vào doanh thu

    - Hoàn trả sau khi kết thúc thuê

### 4. Công thức tính giá:

## a. Giá thuê gốc:

baseRental = pricePerDay × durationDays

## b. Tổng tiền người thuê trả:

totalPrice = baseRental - discountAmount + deliveryFee + insuranceFee

## c. Phí nền tảng:

platformFee = baseRental × platformFeeRatio

## d. Thu nhập chủ xe:

ownerEarning = baseRental - platformFee + deliveryFee

## e. Doanh thu nền tảng:

platformEarning = platformFee - discountAmount

### 5. Ghi chú nghiệp vụ:

- Phí giao xe do hệ thống quy định nhằm đảm bảo minh bạch và dễ so sánh.

- Phí bảo hiểm là dịch vụ bổ sung, nền tảng chỉ đóng vai trò trung gian thu hộ.

- Giảm giá là chi phí marketing do nền tảng chịu, không ảnh hưởng thu nhập chủ xe.
