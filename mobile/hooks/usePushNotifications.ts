import { useEffect, useRef, useState, useCallback } from "react";
// @ts-ignore - expo-notifications cần được cài đặt: npx expo install expo-notifications
import * as Notifications from "expo-notifications";
// @ts-ignore - expo-device cần được cài đặt: npx expo install expo-device
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/auth";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationToken {
  token: string | null;
  error: string | null;
}

export interface UsePushNotificationsReturn {
  expoPushToken: PushNotificationToken;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<void>;
  isRegistered: boolean;
}

/**
 * Hook để quản lý push notifications với Expo Notifications
 * Hỗ trợ notifications khi app đang mở, ở background, hoặc đã đóng
 *
 * @example
 * const { expoPushToken, notification, registerForPushNotifications } = usePushNotifications();
 *
 * useEffect(() => {
 *   registerForPushNotifications();
 * }, []);
 *
 * useEffect(() => {
 *   if (notification) {
 *     console.log("Notification received:", notification);
 *     // Handle notification
 *   }
 * }, [notification]);
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [expoPushToken, setExpoPushToken] = useState<PushNotificationToken>({
    token: null,
    error: null,
  });
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { isAuthenticated } = useAuthStore();

  /**
   * Register for push notifications
   * Chỉ register khi đã đăng nhập và device hỗ trợ
   */
  const registerForPushNotifications = useCallback(async () => {
    try {
      // Chỉ register khi đã đăng nhập
      if (!isAuthenticated) {
        setExpoPushToken({
          token: null,
          error: "User chưa đăng nhập",
        });
        return;
      }

      // Check if device is physical device
      if (!Device.isDevice) {
        setExpoPushToken({
          token: null,
          error: "Push notifications chỉ hoạt động trên thiết bị thật",
        });
        return;
      }

      // Request permissions
      const permissionsResult = await Notifications.getPermissionsAsync();
      const { status: existingStatus } = permissionsResult;
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const requestResult = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = requestResult.status;
      }

      if (finalStatus !== "granted") {
        setExpoPushToken({
          token: null,
          error: "Không có quyền gửi notifications",
        });
        return;
      }

      // Get push token
      // Note: Cần set EXPO_PUBLIC_PROJECT_ID trong .env hoặc app.config.js
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      const token = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      setExpoPushToken({
        token: token.data,
        error: null,
      });
      setIsRegistered(true);

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: "default",
          showBadge: true,
        });
      }
    } catch (error: any) {
      setExpoPushToken({
        token: null,
        error: error?.message || "Lỗi khi đăng ký push notifications",
      });
      setIsRegistered(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Register for push notifications when authenticated
    if (isAuthenticated) {
      registerForPushNotifications();
    } else {
      // Reset khi logout
      setExpoPushToken({ token: null, error: null });
      setIsRegistered(false);
    }
  }, [isAuthenticated, registerForPushNotifications]);

  useEffect(() => {
    // Listen for notifications received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          setNotification(notification);
        }
      );

    // Listen for user tapping on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          setNotification(response.notification);
          // Handle notification tap here
          // Ví dụ: navigate to specific screen
          // router.push(response.notification.request.content.data.screen);
        }
      );

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    registerForPushNotifications,
    isRegistered,
  };
}
