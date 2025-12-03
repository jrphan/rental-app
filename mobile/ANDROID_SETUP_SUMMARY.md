# Tóm tắt cấu hình Android SDK cho WSL2

## Vấn đề ban đầu
Expo không tìm thấy Android SDK và adb, gây ra lỗi:
```
Error: spawn /mnt/c/Users/tampd/AppData/Local/Android/Sdk/platform-tools/adb ENOENT
```

## Giải pháp đã triển khai

### 1. Tạo wrapper script `adb` trong platform-tools
- **Vị trí**: `/mnt/c/Users/tampd/AppData/Local/Android/Sdk/platform-tools/adb`
- **Mục đích**: Expo tìm `adb` (không có .exe) tại đúng đường dẫn này
- **Cách hoạt động**: Wrapper script gọi `adb.exe` từ cùng thư mục

### 2. Cấu hình biến môi trường trong `~/.bashrc`
- `ANDROID_HOME`: Đường dẫn đến Android SDK trên Windows
- `ANDROID_SDK_ROOT`: Tương tự ANDROID_HOME
- `PATH`: Bao gồm platform-tools và các thư mục cần thiết

### 3. Tạo wrapper scripts
- `scripts/adb-wrapper.sh`: Wrapper cho adb (backup)
- `scripts/expo-wrapper.sh`: Wrapper cho Expo tự động load Android SDK environment
- `scripts/setup-android-env.sh`: Script kiểm tra cấu hình

### 4. Cập nhật package.json scripts
Tất cả các script `start`, `android`, `ios`, `web` đã được cập nhật để sử dụng `expo-wrapper.sh`

## Kiểm tra cấu hình

```bash
# Kiểm tra adb wrapper
/mnt/c/Users/tampd/AppData/Local/Android/Sdk/platform-tools/adb version

# Kiểm tra biến môi trường
source ~/.bashrc
echo $ANDROID_HOME

# Test Expo
cd /root/rental-app/mobile
pnpm start
```

## Lưu ý quan trọng

1. **File wrapper `adb`**: Đã được tạo trực tiếp trong thư mục Windows SDK, đảm bảo Expo tìm thấy tại đúng vị trí
2. **Shell mới**: Nếu biến môi trường chưa load, mở terminal mới hoặc chạy `source ~/.bashrc`
3. **Username Windows**: Nếu username Windows khác "tampd", cần cập nhật đường dẫn trong:
   - `~/.bashrc`
   - `mobile/scripts/expo-wrapper.sh`
   - File wrapper `/mnt/c/Users/tampd/.../platform-tools/adb`

## Sử dụng

```bash
# Chạy Expo development server
cd /root/rental-app/mobile
pnpm start

# Hoặc chạy trên Android
pnpm run android
```

