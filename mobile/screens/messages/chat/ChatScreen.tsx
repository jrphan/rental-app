import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import ChatList from "./components/ChatList";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { apiChat } from "@/services/api.chat";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useRefreshControl } from "@/hooks/useRefreshControl";

export default function ChatScreen() {
  const { isAuthenticated } = useAuthStore();

  // Connect to chat socket for notifications
  useChatSocket({
    enabled: isAuthenticated,
  });

  const {
    data: chats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: () => apiChat.getMyChats(),
    enabled: isAuthenticated,
  });

  const { refreshControl } = useRefreshControl({
    queryKeys: [["chats"]],
    refetchFunctions: [refetch],
  });

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6 py-12">
        <MaterialIcons name="info-outline" size={64} color="#9CA3AF" />
        <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
          Vui lòng đăng nhập
        </Text>
        <Text className="mt-2 text-base text-gray-600 text-center">
          Đăng nhập để xem và quản lý tin nhắn của bạn
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
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Đang tải danh sách chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
          Lỗi khi tải danh sách chat
        </Text>
        <Text className="mt-2 text-base text-gray-600 text-center">
          {error instanceof Error ? error.message : "Đã xảy ra lỗi"}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-6 bg-orange-600 rounded-xl px-6 py-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white font-semibold text-base">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <ChatList data={chats || []} refreshControl={refreshControl} />;
}
