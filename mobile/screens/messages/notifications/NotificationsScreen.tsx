import React, { useMemo, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
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

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

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

  const handleItemAction = useCallback(
    async (action: string, item: NotificationItem) => {
      if ((action === "Đã đọc" || action === "markAsRead") && !item.isRead) {
        try {
          await apiNotification.markAsRead(item.id);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
        }
      }
    },
    [queryClient]
  );

  // Tabs config
  const notificationTabs = useMemo<TabConfig[]>(
    () => [
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
            onRefresh={refetchUnread}
            onItemAction={handleItemAction}
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
            onRefresh={refetchAll}
            onItemAction={handleItemAction}
          />
        ),
      },
    ],
    [
      unreadNotifications,
      allNotifications,
      isLoadingUnread,
      isLoadingAll,
      refetchUnread,
      refetchAll,
      handleItemAction,
    ]
  );

  return (
    <View className="flex-1">
      <Tabs tabs={notificationTabs} variant="inline" />
    </View>
  );
}
