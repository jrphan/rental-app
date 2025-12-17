import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import SwipeActionRow from "@/components/SwipeActionRow";
import type { ChatItem as ChatItemType } from "../types";

interface ChatItemProps {
  item: ChatItemType;
  onAction?: (action: string, item: ChatItemType) => void;
}

export default function ChatItem({ item, onAction }: ChatItemProps) {
  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, item);
    } else {
      Alert.alert(action, `${item.name} • ${action.toLowerCase()}`);
    }
  };

  return (
    <SwipeActionRow
      leftActions={[
        {
          label: "Đã đọc",
          backgroundColor: "#10b981",
          textColor: "#ffffff",
          onPress: () => handleAction("Đã đọc"),
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
        className="flex-row gap-2 items-center px-4 py-4 bg-white border-b border-gray-100 active:bg-gray-50"
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View
          className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3"
          style={{ height: 40, width: 40 }}
        >
          <Text className="text-primary-600 font-semibold text-base">
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-xs text-gray-500">{item.time}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View className="ml-2 bg-primary-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                <Text className="text-white text-xs font-semibold">
                  {item.unread > 9 ? "9+" : item.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </SwipeActionRow>
  );
}
