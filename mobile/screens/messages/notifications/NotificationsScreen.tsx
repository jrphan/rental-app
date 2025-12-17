import React, { useMemo } from "react";
import { View } from "react-native";
import { Tabs } from "@/components/ui/tabs";
import type { TabConfig } from "@/components/ui/tabs";
import NotificationsList from "./components/NotificationsList";
import { mockNotifications } from "./mockData";

export default function NotificationsScreen() {
  // Phân chia notifications theo trạng thái đọc/chưa đọc
  const unreadNotifications = useMemo(
    () => mockNotifications.filter((item) => !item.isRead),
    []
  );

  const allNotifications = useMemo(() => mockNotifications, []);

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
        content: <NotificationsList data={unreadNotifications} />,
      },
      {
        label: "Tất cả",
        value: "all",
        route: "",
        content: <NotificationsList data={allNotifications} />,
      },
    ],
    [unreadNotifications, allNotifications]
  );

  return (
    <View className="flex-1">
      <Tabs tabs={notificationTabs} variant="inline" />
    </View>
  );
}
