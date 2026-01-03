import React from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import ChatItem from "./ChatItem";
import type { Chat } from "@/services/api.chat";
import { router } from "expo-router";
import { formatTimeAgo } from "@/utils/date.utils";

interface ChatListProps {
  data: Chat[];
  onItemAction?: (action: string, item: Chat) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function ChatList({
  data,
  onItemAction,
  onRefresh,
  isRefreshing = false,
}: ChatListProps) {
  const handleItemPress = (chat: Chat) => {
    router.push(`/messages/chat/${chat.id}` as any);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } else if (diffInHours < 48) {
        return "Hôm qua";
      } else if (diffInHours < 168) {
        return `${Math.floor(diffInHours / 24)} ngày trước`;
      } else {
        return formatTimeAgo(date);
      }
    } catch {
      return "";
    }
  };

  const transformedData = data.map((chat) => ({
    id: chat.id,
    name: chat.otherUser.fullName || "Người dùng",
    lastMessage: chat.lastMessage?.content || "Chưa có tin nhắn",
    time: chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : "",
    unread: chat.unreadCount,
    avatar: chat.otherUser.avatar || undefined,
    chat: chat, // Keep original chat data
  })) as {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    avatar?: string;
    chat: Chat;
  }[];

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={transformedData}
        renderItem={({ item }) => {
          const chatData = (item as any).chat as Chat | undefined;
          return (
            <ChatItem
              item={item}
              onAction={
                onItemAction && chatData
                  ? () => {
                    // onAction will be called with action and item
                    // We'll handle it in ChatItem component
                  }
                  : undefined
              }
              onPress={() => chatData && handleItemPress(chatData)}
            />
          );
        }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 mt-6">
            <Text className="text-gray-500 text-base">
              Không có tin nhắn
            </Text>
          </View>
        }
      />
    </View>
  );
}
