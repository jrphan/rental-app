# Setup Notifications - Expo & WebSocket

Hướng dẫn setup đầy đủ cho Expo Push Notifications và WebSocket real-time notifications.

## 1. Expo Push Notifications Setup

### Bước 1: Lấy Expo Project ID

1. Đăng nhập vào [Expo Dashboard](https://expo.dev/)
2. Tạo project mới hoặc sử dụng project hiện có
3. Copy **Project ID** (dạng: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Bước 2: Cấu hình Project ID

Có 2 cách để config:

#### Cách 1: Sử dụng file `.env` (Khuyến nghị cho development)

Tạo file `.env` trong thư mục `mobile/`:

```bash
EXPO_PUBLIC_PROJECT_ID=your-project-id-here
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Lưu ý**: File `.env` nên được thêm vào `.gitignore` để không commit lên git.

#### Cách 2: Sử dụng `app.config.js` (Cho production build)

Tạo file `app.config.js` trong thư mục `mobile/`:

```javascript
export default {
  expo: {
    // ... các config khác từ app.json
    extra: {
      EXPO_PUBLIC_PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID || "your-project-id-here",
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    },
  },
};
```

Nếu dùng `app.config.js`, bạn có thể xóa `app.json` hoặc merge config vào `app.config.js`.

### Bước 3: Kiểm tra plugin đã được cấu hình

File `app.json` đã có plugin `expo-notifications`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/icon.png",
        "color": "#EA580C",
        "sounds": []
      }
    ]
  ]
}
```

### Bước 4: Cài đặt packages (Đã được cài đặt)

Các packages cần thiết đã được cài đặt:
- ✅ `expo-notifications`
- ✅ `expo-device`

### Bước 5: Rebuild app sau khi thêm config

Sau khi thêm `EXPO_PUBLIC_PROJECT_ID`, bạn cần rebuild app:

```bash
# Development build
npx expo prebuild --clean
npx expo run:android  # hoặc run:ios

# Hoặc nếu dùng Expo Go (có giới hạn)
npx expo start
```

**Lưu ý quan trọng**: Push Notifications **KHÔNG hoạt động trên Expo Go**. Bạn cần:
- Development build: `npx expo run:android` hoặc `npx expo run:ios`
- Hoặc Production build: `eas build`

---

## 2. WebSocket Setup

### Bước 1: Cấu hình API URL

Đảm bảo `EXPO_PUBLIC_API_URL` đã được set (xem phần trên).

### Bước 2: Kiểm tra backend WebSocket Gateway

Backend đã được setup với:
- ✅ WebSocket Gateway tại namespace `/notifications`
- ✅ JWT Authentication
- ✅ CORS enabled

### Bước 3: Test WebSocket connection

WebSocket sẽ tự động connect khi:
1. User đã đăng nhập (có JWT token)
2. App đang mở (trong foreground hoặc background)
3. `useNotificationSocket` hook được gọi trong component

---

## 3. Kiểm tra hoạt động

### Test Push Notifications

1. Đăng nhập vào app
2. Hook `usePushNotifications` sẽ tự động register device token
3. Kiểm tra console log để xem token đã được register chưa
4. Test gửi notification từ backend

### Test WebSocket

1. Đăng nhập vào app
2. Mở console log, tìm message: `"Notification socket connected: <socket-id>"`
3. Khi có notification mới, sẽ thấy log: `"Received notification: ..."`

---

## 4. Troubleshooting

### Push Notifications không hoạt động

1. **Kiểm tra Project ID đã đúng chưa**
   ```bash
   # In ra console để check
   console.log(process.env.EXPO_PUBLIC_PROJECT_ID)
   ```

2. **Kiểm tra device có phải physical device không**
   - Push notifications chỉ hoạt động trên physical device
   - Simulator/Emulator không hỗ trợ

3. **Kiểm tra permissions**
   - iOS: Settings > App > Notifications
   - Android: Settings > Apps > App > Notifications

4. **Kiểm tra build type**
   - Expo Go: ❌ Không hỗ trợ
   - Development build: ✅ Hỗ trợ
   - Production build: ✅ Hỗ trợ

### WebSocket không connect

1. **Kiểm tra API URL**
   ```bash
   console.log(process.env.EXPO_PUBLIC_API_URL)
   ```

2. **Kiểm tra JWT token**
   - Token phải còn valid
   - Token được pass qua `auth.token` trong socket connection

3. **Kiểm tra backend logs**
   - Xem có log `"User <userId> connected with socket <socketId>"` không

4. **Kiểm tra network**
   - Đảm bảo device có thể connect đến backend
   - Check firewall/network settings

---

## 5. Environment Variables Summary

Tạo file `.env` trong `mobile/`:

```env
# Expo Project ID (lấy từ Expo Dashboard)
EXPO_PUBLIC_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:3000
# Hoặc cho production:
# EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 6. Production Checklist

Trước khi deploy production:

- [ ] Đã setup `EXPO_PUBLIC_PROJECT_ID` trong production config
- [ ] Đã setup `EXPO_PUBLIC_API_URL` cho production domain
- [ ] Đã test push notifications trên physical device
- [ ] Đã test WebSocket connection
- [ ] Đã config CORS trên backend cho production domain
- [ ] Đã rebuild app với production config

---

## Tài liệu tham khảo

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)

