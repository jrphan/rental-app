# Push Notifications Setup Guide

Hướng dẫn setup push notifications cho mobile app sử dụng Expo Notifications.

## 1. Cài đặt Dependencies

```bash
npx expo install expo-notifications expo-device
```

## 2. Cấu hình app.json

File `app.json` đã được cấu hình với plugin `expo-notifications`. Nếu cần thay đổi, kiểm tra phần `plugins`.

## 3. Cấu hình Project ID (Cho Expo Push Notifications)

Để sử dụng Expo Push Notification Service (EPNS), bạn cần:

1. Tạo project trên [Expo Dashboard](https://expo.dev)
2. Lấy Project ID từ dashboard
3. Thêm vào `.env` hoặc `app.config.js`:

```env
EXPO_PUBLIC_PROJECT_ID=your-project-id-here
```

Hoặc trong `app.config.js`:

```js
export default {
  expo: {
    extra: {
      EXPO_PUBLIC_PROJECT_ID: "your-project-id-here",
    },
  },
};
```

## 4. Sử dụng Hook

### Basic Usage

```tsx
import { usePushNotifications } from "@/hooks/usePushNotifications";

function MyComponent() {
  const { expoPushToken, notification, isRegistered } = usePushNotifications();

  useEffect(() => {
    if (expoPushToken.token) {
      console.log("Push token:", expoPushToken.token);
      // Gửi token này lên server để lưu trữ
      // await api.savePushToken(expoPushToken.token);
    }
  }, [expoPushToken]);

  useEffect(() => {
    if (notification) {
      console.log("Notification received:", notification);
      // Xử lý notification
    }
  }, [notification]);

  return (
    <View>
      {isRegistered ? (
        <Text>Đã đăng ký nhận notifications</Text>
      ) : (
        <Text>Chưa đăng ký notifications</Text>
      )}
    </View>
  );
}
```

### Handle Notification Tap

Để xử lý khi user tap vào notification, bạn có thể sử dụng `notification` state hoặc thêm navigation logic trong hook.

## 5. Gửi Push Notifications từ Backend

### Sử dụng Expo Push Notification Service

**Lưu ý:** Endpoint `https://exp.host/--/api/v2/push/send` là endpoint cố định của Expo Push Notification Service (EPNS). Đây là service miễn phí của Expo để gửi push notifications.

```typescript
// Backend code example
import axios from "axios";

// Endpoint cố định của Expo Push Notification Service
const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
) {
  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
  };

  await axios.post(EXPO_PUSH_API_URL, message, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
  });
}
```

**Tùy chọn khác:**

- Nếu muốn dùng service riêng, có thể setup Firebase Cloud Messaging (FCM) hoặc AWS SNS
- Với FCM, cần cấu hình Firebase và sử dụng FCM tokens thay vì Expo push tokens

### Hoặc sử dụng Firebase Cloud Messaging (FCM)

Nếu muốn sử dụng FCM thay vì EPNS, cần cấu hình thêm Firebase.

## 6. Background Notifications

Notifications sẽ tự động hoạt động khi app ở background hoặc đã đóng nhờ cấu hình trong `app.json` và hook đã setup sẵn.

### iOS Background Notifications

- Cần cấu hình capabilities trong Xcode
- Cần có Apple Developer account để test trên device thật
- Background notifications chỉ hoạt động trên device thật, không hoạt động trên simulator

### Android Background Notifications

- Tự động hoạt động sau khi cài đặt
- Cần cấu hình notification channel (đã được setup trong hook)

## 7. Testing

### Test trên Device Thật

Push notifications chỉ hoạt động trên thiết bị thật, không hoạt động trên simulator/emulator.

1. Build app lên device:

   ```bash
   npx expo run:ios
   # hoặc
   npx expo run:android
   ```

2. Đăng nhập vào app để trigger registration

3. Gửi test notification từ Expo dashboard hoặc backend

### Test Notification từ Expo Dashboard

1. Vào [Expo Dashboard](https://expo.dev)
2. Chọn project
3. Vào phần "Push Notifications"
4. Nhập push token và gửi test notification

## 8. Troubleshooting

### Không nhận được notifications

1. Kiểm tra permissions đã được grant chưa
2. Kiểm tra device có phải là thiết bị thật không (không phải simulator)
3. Kiểm tra push token đã được lưu trên server chưa
4. Kiểm tra user đã đăng nhập chưa (hook chỉ register khi authenticated)

### Lỗi "Cannot find module 'expo-notifications'"

Chạy lại:

```bash
npx expo install expo-notifications expo-device
```

### Notifications không hiển thị khi app đóng

- iOS: Cần cấu hình Background Modes trong Xcode
- Android: Kiểm tra notification channel đã được tạo chưa

## 9. Best Practices

1. **Lưu push token trên server**: Khi nhận được token, gửi lên server để lưu trữ
2. **Xử lý token refresh**: Token có thể thay đổi, cần update trên server
3. **Handle notification tap**: Navigate đến đúng screen khi user tap notification
4. **Badge count**: Update badge count khi có notifications mới
5. **Error handling**: Xử lý các trường hợp lỗi (permission denied, network error, etc.)

## 10. Security

- Không hardcode push tokens trong code
- Validate push tokens trên server trước khi gửi notifications
- Sử dụng HTTPS khi gửi notifications
- Implement rate limiting để tránh spam notifications
