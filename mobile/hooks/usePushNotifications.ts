import { useEffect, useRef, useState, useCallback } from "react";
// @ts-ignore - expo-device cần được cài đặt: npx expo install expo-device
import * as Device from "expo-device";
// @ts-ignore - expo-constants cần được cài đặt: npx expo install expo-constants
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/auth";
import { apiNotification } from "@/services/api.notification";
import { router } from "expo-router";
import ROUTES from "@/constants/routes";

// Check if we're running in Expo Go (which doesn't support remote push notifications)
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Type definitions for notifications (to avoid importing when in Expo Go)
type Notification = {
  request: {
    content: {
      title?: string;
      body?: string;
      data?: any;
    };
  };
};

type NotificationResponse = {
  notification: Notification;
};

type Subscription = {
  remove: () => void;
};

type NotificationsModule = {
  setNotificationHandler: (handler: any) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: (options?: any) => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options?: {
    projectId?: string;
  }) => Promise<{ data: string }>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: any
  ) => Promise<void>;
  addNotificationReceivedListener: (
    listener: (notification: Notification) => void
  ) => Subscription;
  addNotificationResponseReceivedListener: (
    listener: (response: NotificationResponse) => void
  ) => Subscription;
  AndroidImportance: {
    MAX: number;
  };
};

// Lazy load notifications module only when not in Expo Go
let Notifications: NotificationsModule | null = null;

const loadNotificationsModule =
  async (): Promise<NotificationsModule | null> => {
    if (isExpoGo) {
      return null;
    }

    try {
      // Dynamic import to avoid loading in Expo Go
      const notificationsModule = await import("expo-notifications");
      Notifications = notificationsModule as any;

      // Configure notification handler
      if (Notifications) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }

      return Notifications;
    } catch (error) {
      console.warn("Failed to load expo-notifications:", error);
      return null;
    }
  };

export interface PushNotificationToken {
  token: string | null;
  error: string | null;
}

export interface UsePushNotificationsReturn {
  expoPushToken: PushNotificationToken;
  notification: Notification | null;
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
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);
  const { isAuthenticated } = useAuthStore();
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  // Load notifications module on mount
  useEffect(() => {
    loadNotificationsModule().then((module) => {
      setNotificationsLoaded(true);
    });
  }, []);

  /**
   * Register for push notifications
   * Chỉ register khi đã đăng nhập và device hỗ trợ
   */
  const registerForPushNotifications = useCallback(async () => {
    try {
      console.log("[PushNotifications] Starting registration...");
      console.log("[PushNotifications] isAuthenticated:", isAuthenticated);
      console.log("[PushNotifications] isExpoGo:", isExpoGo);
      console.log("[PushNotifications] Notifications module:", !!Notifications);
      console.log("[PushNotifications] Device.isDevice:", Device.isDevice);

      // Skip if running in Expo Go (remote push notifications not supported)
      if (isExpoGo || !Notifications) {
        console.warn(
          "[PushNotifications] Skipped: Expo Go or Notifications module not available"
        );
        setExpoPushToken({
          token: null,
          error:
            "Push notifications không được hỗ trợ trong Expo Go. Vui lòng sử dụng development build.",
        });
        return;
      }

      // Chỉ register khi đã đăng nhập
      if (!isAuthenticated) {
        console.log("[PushNotifications] Skipped: User not authenticated");
        setExpoPushToken({
          token: null,
          error: "User chưa đăng nhập",
        });
        return;
      }

      // Check if device is physical device
      if (!Device.isDevice) {
        console.warn("[PushNotifications] Skipped: Not a physical device");
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

      console.log("[PushNotifications] projectId:", projectId);

      const token = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      console.log(
        "[PushNotifications] Expo push token received:",
        token.data?.substring(0, 20) + "..."
      );

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

      // Send token to backend
      console.log(
        "[PushNotifications] Attempting to register device token with backend..."
      );
      try {
        const registerData = {
          token: token.data,
          platform: Platform.OS,
          deviceId: Device.modelName || undefined,
        };
        console.log("[PushNotifications] Register data:", {
          ...registerData,
          token: registerData.token.substring(0, 20) + "...",
        });

        await apiNotification.registerDeviceToken(registerData);
        console.log(
          "[PushNotifications] ✅ Device token registered successfully with backend"
        );
      } catch (error: any) {
        console.error(
          "[PushNotifications] ❌ Failed to register device token:",
          error
        );
        console.error("[PushNotifications] Error details:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
        // Don't fail the entire registration if backend call fails
      }
    } catch (error: any) {
      console.error("[PushNotifications] ❌ Registration error:", error);
      console.error("[PushNotifications] Error message:", error?.message);
      setExpoPushToken({
        token: null,
        error: error?.message || "Lỗi khi đăng ký push notifications",
      });
      setIsRegistered(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    console.log(
      "[PushNotifications] useEffect triggered, isAuthenticated:",
      isAuthenticated
    );
    // Register for push notifications when authenticated
    if (isAuthenticated) {
      console.log(
        "[PushNotifications] User authenticated, calling registerForPushNotifications..."
      );
      registerForPushNotifications();
    } else {
      console.log(
        "[PushNotifications] User not authenticated, resetting token"
      );
      // Reset khi logout
      setExpoPushToken({ token: null, error: null });
      setIsRegistered(false);
    }
  }, [isAuthenticated, registerForPushNotifications]);

  useEffect(() => {
    // Skip setting up listeners if in Expo Go or notifications not loaded
    if (isExpoGo || !Notifications || !notificationsLoaded) {
      return;
    }

    try {
      // Listen for notifications received while app is in foreground
      notificationListener.current =
        Notifications.addNotificationReceivedListener(
          (notification: Notification) => {
            setNotification(notification);
          }
        );

      // Listen for user tapping on notification
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: NotificationResponse) => {
            setNotification(response.notification);
            // Handle notification tap - navigate to appropriate screen
            const data = response.notification.request.content.data;
            const notificationType = data?.type;

            if (notificationType === "KYC_UPDATE") {
              // Navigate tới profile/KYC screen
              router.push(ROUTES.PROFILE);
            } else if (notificationType === "RENTAL_UPDATE") {
              // Navigate tới rental detail nếu có rentalId
              if (data?.rentalId) {
                router.push(`/rental/${data.rentalId}` as any);
              } else if (data?.vehicleId) {
                // Nếu có vehicleId nhưng không có rentalId, navigate tới vehicle detail
                router.push(`/vehicle/${data.vehicleId}` as any);
              } else {
                // Fallback: navigate tới danh sách rentals
                router.push(ROUTES.BOOKINGS);
              }
            } else if (notificationType === "PAYMENT") {
              // Navigate tới rental detail nếu có rentalId, nếu không thì tới danh sách rentals
              if (data?.rentalId) {
                router.push(`/rental/${data.rentalId}` as any);
              } else {
                router.push(ROUTES.BOOKINGS);
              }
            } else if (data?.vehicleId) {
              // Nếu có vehicleId thì navigate tới vehicle detail
              router.push(`/vehicle/${data.vehicleId}` as any);
            } else if (data?.reviewId && data?.rentalId) {
              // Nếu có reviewId và rentalId, navigate tới rental detail
              router.push(`/rental/${data.rentalId}` as any);
            }
          }
        );
    } catch (error) {
      console.warn("Failed to set up notification listeners:", error);
    }

    return () => {
      // Cleanup listeners
      if (notificationListener.current) {
        try {
          notificationListener.current.remove();
        } catch (error) {
          console.warn("Error removing notification listener:", error);
        }
        notificationListener.current = null;
      }
      if (responseListener.current) {
        try {
          responseListener.current.remove();
        } catch (error) {
          console.warn("Error removing response listener:", error);
        }
        responseListener.current = null;
      }
    };
  }, [notificationsLoaded]);

  return {
    expoPushToken,
    notification,
    registerForPushNotifications,
    isRegistered,
  };
}
