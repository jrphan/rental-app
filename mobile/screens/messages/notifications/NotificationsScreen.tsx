import React, { useMemo, useCallback } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Tabs } from "@/components/ui/tabs";
import type { TabConfig } from "@/components/ui/tabs";
import NotificationsList from "./components/NotificationsList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiNotification,
  type Notification,
} from "@/services/api.notification";
import { COLORS } from "@/constants/colors";
import { formatTimeAgo } from "@/utils/date.utils";
import type { NotificationItem } from "./types";
import { useNotificationSocket } from "@/hooks/notifications/useNotificationSocket";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { useToast } from "@/hooks/useToast";
import ROUTES from "@/constants/routes";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRefreshControl } from "@/hooks/useRefreshControl";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();

  // Setup WebSocket connection for real-time notifications
  useNotificationSocket({
    enabled: isAuthenticated,
  });

  // Fetch all notifications
  const {
    data: allNotificationsData,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => apiNotification.getNotifications({ limit: 100 }),
    enabled: isAuthenticated,
  });

  // Fetch unread notifications
  const {
    data: unreadNotificationsData,
    isLoading: isLoadingUnread,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () =>
      apiNotification.getNotifications({ isRead: false, limit: 100 }),
    enabled: isAuthenticated,
  });

  // Convert API notifications to component format
  const mapNotificationToItem = (notif: Notification): NotificationItem => {
    // Map notification type to component type
    let type: NotificationItem["type"] = "system";
    if (notif.type === "KYC_UPDATE") {
      type = notif.data?.action === "approved" ? "success" : "warning";
    } else if (notif.type === "RENTAL_UPDATE") {
      type = "booking";
    } else if (notif.type === "PAYMENT") {
      type = "payment";
    }

    return {
      id: notif.id,
      type,
      title: notif.title,
      message: notif.message,
      time: formatTimeAgo(notif.createdAt),
      isRead: notif.isRead,
      originalType: notif.type,
      originalData: notif.data,
    };
  };

  const allNotifications = useMemo(
    () => (allNotificationsData?.items || []).map(mapNotificationToItem),
    [allNotificationsData]
  );

  const unreadNotifications = useMemo(
    () => (unreadNotificationsData?.items || []).map(mapNotificationToItem),
    [unreadNotificationsData]
  );

  // Setup refresh control for notifications
  const allRefreshControl = useRefreshControl({
    queryKeys: [["notifications", "all"]],
    refetchFunctions: [refetchAll],
  });

  const unreadRefreshControl = useRefreshControl({
    queryKeys: [["notifications", "unread"]],
    refetchFunctions: [refetchUnread],
  });

  const handleItemAction = useCallback(
    async (action: string, item: NotificationItem) => {
      if (action === "Xóa") {
        try {
          await apiNotification.deleteNotification(item.id);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          toast.showSuccess("Đã xóa thông báo");
        } catch (error: any) {
          console.error("Failed to delete notification:", error);
          toast.showError(error?.message || "Xóa thông báo thất bại");
        }
      } else if (
        (action === "Đã đọc" || action === "markAsRead") &&
        !item.isRead
      ) {
        try {
          await apiNotification.markAsRead(item.id);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
        }
      }
    },
    [queryClient, toast]
  );

  const handleItemNavigate = useCallback((item: NotificationItem) => {
    const { originalType, originalData } = item;

    // Navigate dựa trên notification type và data
    if (originalType === "KYC_UPDATE") {
      // Navigate tới profile/KYC screen
      router.push(ROUTES.PROFILE);
    } else if (originalType === "RENTAL_UPDATE") {
      // Navigate tới rental detail nếu có rentalId
      if (originalData?.rentalId) {
        router.push(`/rental/${originalData.rentalId}` as any);
      } else if (originalData?.vehicleId) {
        // Nếu có vehicleId nhưng không có rentalId, có thể là thông báo về xe
        router.push(`/vehicle/${originalData.vehicleId}` as any);
      } else {
        // Fallback: navigate tới danh sách rentals
        router.push(ROUTES.BOOKINGS);
      }
    } else if (originalType === "PAYMENT") {
      // Navigate tới rental detail nếu có rentalId, nếu không thì tới danh sách rentals
      if (originalData?.rentalId) {
        router.push(`/rental/${originalData.rentalId}` as any);
      } else {
        router.push(ROUTES.BOOKINGS);
      }
    } else if (originalData?.vehicleId) {
      // Nếu có vehicleId thì navigate tới vehicle detail
      router.push(`/vehicle/${originalData.vehicleId}` as any);
    } else if (originalData?.reviewId && originalData?.rentalId) {
      // Nếu có reviewId và rentalId, navigate tới rental detail
      router.push(`/rental/${originalData.rentalId}` as any);
    } else {
      // Default: không navigate
      // Có thể bỏ qua nếu không cần navigate
    }
  }, []);

  // Empty state component for unauthenticated users
  const AuthRequiredMessage = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <MaterialIcons name="info-outline" size={64} color="#9CA3AF" />
      <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
        Vui lòng đăng nhập
      </Text>
      <Text className="mt-2 text-base text-gray-600 text-center">
        Đăng nhập để xem và quản lý thông báo của bạn
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(auth)/login")}
        className="mt-6 bg-orange-600 rounded-xl px-6 py-3"
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text className="text-white font-semibold text-base">Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );

  // Tabs config
  const notificationTabs = useMemo<TabConfig[]>(() => {
    if (!isAuthenticated) {
      return [
        {
          label: "Chưa đọc",
          value: "unread",
          route: "",
          content: <AuthRequiredMessage />,
        },
        {
          label: "Tất cả",
          value: "all",
          route: "",
          content: <AuthRequiredMessage />,
        },
      ];
    }

    return [
      {
        label: `Chưa đọc${
          unreadNotifications.length > 0
            ? ` (${unreadNotifications.length})`
            : ""
        }`,
        value: "unread",
        route: "",
        content: isLoadingUnread ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <NotificationsList
            data={unreadNotifications}
            refreshControl={unreadRefreshControl.refreshControl}
            onItemAction={handleItemAction}
            onItemNavigate={handleItemNavigate}
          />
        ),
      },
      {
        label: "Tất cả",
        value: "all",
        route: "",
        content: isLoadingAll ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <NotificationsList
            data={allNotifications}
            refreshControl={allRefreshControl.refreshControl}
            onItemAction={handleItemAction}
            onItemNavigate={handleItemNavigate}
          />
        ),
      },
    ];
  }, [
    isAuthenticated,
    unreadNotifications,
    allNotifications,
    isLoadingUnread,
    isLoadingAll,
    refetchUnread,
    refetchAll,
    handleItemAction,
    handleItemNavigate,
  ]);

  return (
    <View className="flex-1">
      <Tabs tabs={notificationTabs} variant="inline" />
    </View>
  );
}
