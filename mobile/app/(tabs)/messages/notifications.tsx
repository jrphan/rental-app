import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { Tabs } from "@/components/ui/tabs";
import type { TabConfig } from "@/components/ui/tabs";
import SwipeActionRow from "@/components/SwipeActionRow";

interface NotificationItem {
  id: string;
  type: "booking" | "message" | "payment" | "system";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "booking",
    title: "Đặt xe thành công",
    message: "Bạn đã đặt xe Honda Wave thành công. Vui lòng kiểm tra chi tiết.",
    time: "5 phút trước",
    isRead: false,
  },
  {
    id: "2",
    type: "message",
    title: "Tin nhắn mới",
    message: "Nguyễn Văn A đã gửi cho bạn một tin nhắn",
    time: "15 phút trước",
    isRead: false,
  },
  {
    id: "3",
    type: "payment",
    title: "Thanh toán thành công",
    message: "Bạn đã thanh toán 500.000đ cho đơn hàng #12345",
    time: "1 giờ trước",
    isRead: true,
  },
  {
    id: "4",
    type: "system",
    title: "Cập nhật hệ thống",
    message: "Hệ thống sẽ bảo trì vào ngày mai từ 2h-4h sáng",
    time: "2 giờ trước",
    isRead: true,
  },
  {
    id: "5",
    type: "booking",
    title: "Xe đã được trả",
    message:
      "Xe của bạn đã được trả thành công. Vui lòng kiểm tra và xác nhận.",
    time: "1 ngày trước",
    isRead: true,
  },
  {
    id: "6",
    type: "booking",
    title: "Đặt xe thành công",
    message: "Bạn đã đặt xe Honda Wave thành công. Vui lòng kiểm tra chi tiết.",
    time: "5 phút trước",
    isRead: false,
  },
  {
    id: "7",
    type: "message",
    title: "Tin nhắn mới",
    message: "Nguyễn Văn A đã gửi cho bạn một tin nhắn",
    time: "15 phút trước",
    isRead: false,
  },
  {
    id: "8",
    type: "payment",
    title: "Thanh toán thành công",
    message: "Bạn đã thanh toán 500.000đ cho đơn hàng #12345",
    time: "1 giờ trước",
    isRead: true,
  },
  {
    id: "9",
    type: "system",
    title: "Cập nhật hệ thống",
    message: "Hệ thống sẽ bảo trì vào ngày mai từ 2h-4h sáng",
    time: "2 giờ trước",
    isRead: true,
  },
  {
    id: "10",
    type: "booking",
    title: "Xe đã được trả",
    message:
      "Xe của bạn đã được trả thành công. Vui lòng kiểm tra và xác nhận.",
    time: "1 ngày trước",
    isRead: true,
  },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "booking":
      return "directions-car";
    case "message":
      return "message";
    case "payment":
      return "payment";
    case "system":
      return "info";
    default:
      return "notifications";
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "booking":
      return COLORS.primary;
    case "message":
      return "#3B82F6";
    case "payment":
      return "#10B981";
    case "system":
      return "#6B7280";
    default:
      return COLORS.primary;
  }
};

// Component để render notification item
const NotificationItemComponent = ({ item }: { item: NotificationItem }) => {
  const iconColor = getNotificationColor(item.type);

  const handleAction = (action: string) => {
    Alert.alert(action, `${item.title} • ${action.toLowerCase()}`);
  };

  return (
    <SwipeActionRow
      leftActions={[
        {
          label: item.isRead ? "Chưa đọc" : "Đã đọc",
          backgroundColor: "#10b981",
          textColor: "#ffffff",
          onPress: () => handleAction(item.isRead ? "Chưa đọc" : "Đã đọc"),
        },
      ]}
      rightActions={[
        {
          label: "Ghim",
          backgroundColor: "#f59e0b",
          textColor: "#ffffff",
          onPress: () => handleAction("Ghim"),
        },
        {
          label: "Xóa",
          backgroundColor: "#ef4444",
          textColor: "#ffffff",
          onPress: () => handleAction("Xóa"),
        },
      ]}
    >
      <TouchableOpacity
        className={`flex-row px-4 py-3 border-b border-gray-100 active:bg-gray-50 ${
          !item.isRead ? "bg-blue-50" : "bg-white"
        }`}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <MaterialIcons
            name={getNotificationIcon(item.type) as any}
            size={20}
            color={iconColor}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <Text
              className={`text-base font-semibold flex-1 ${
                !item.isRead ? "text-gray-900" : "text-gray-700"
              }`}
            >
              {item.title}
            </Text>
            {!item.isRead && (
              <View className="w-2 h-2 rounded-full bg-primary-500 ml-2 mt-1" />
            )}
          </View>
          <Text
            className={`text-sm mb-1 ${
              !item.isRead ? "text-gray-700" : "text-gray-500"
            }`}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text className="text-xs text-gray-400">{item.time}</Text>
        </View>
      </TouchableOpacity>
    </SwipeActionRow>
  );
};

// Component để render notifications list
const NotificationsList = ({ data }: { data: NotificationItem[] }) => {
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={data}
        renderItem={({ item }) => <NotificationItemComponent item={item} />}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons
              name="notifications-none"
              size={48}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 text-base mt-4">
              Không có thông báo
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default function NotificationsTab() {
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
      <Tabs
        tabs={notificationTabs}
        variant="inline"
        className="px-4 pt-3 pb-2 bg-white"
      />
    </View>
  );
}
