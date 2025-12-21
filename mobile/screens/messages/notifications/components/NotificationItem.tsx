import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import SwipeActionRow from "@/components/SwipeActionRow";
import type { NotificationItem as NotificationItemType } from "../types";
import { getNotificationIcon, getNotificationColor } from "../utils";

interface NotificationItemProps {
  item: NotificationItemType;
  onAction?: (action: string, item: NotificationItemType) => void;
  onNavigate?: (item: NotificationItemType) => void;
}

export default function NotificationItem({
  item,
  onAction,
  onNavigate,
}: NotificationItemProps) {
  const iconColor = getNotificationColor(item.type);

  const handleAction = (action: string) => {
    if (action === "Xóa") {
      Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa thông báo này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            if (onAction) {
              onAction(action, item);
            }
          },
        },
      ]);
    } else {
      if (onAction) {
        onAction(action, item);
      } else {
        Alert.alert(action, `${item.title} • ${action.toLowerCase()}`);
      }
    }
  };

  const handlePress = () => {
    // Nếu chưa đọc thì mark as read trước
    if (!item.isRead && onAction) {
      onAction("markAsRead", item);
    }
    // Sau đó navigate
    if (onNavigate) {
      onNavigate(item);
    }
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
          label: "Xóa",
          backgroundColor: "#ef4444",
          textColor: "#ffffff",
          onPress: () => handleAction("Xóa"),
        },
      ]}
    >
      <TouchableOpacity
        className={`flex-row gap-2 px-4 py-3 border-b border-gray-100 active:bg-gray-50 ${
          !item.isRead ? "bg-blue-50" : "bg-white"
        }`}
        activeOpacity={0.7}
        onPress={handlePress}
      >
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${iconColor}15`, width: 40, height: 40 }}
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
}
