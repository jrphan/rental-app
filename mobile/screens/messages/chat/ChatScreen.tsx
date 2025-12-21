import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import ChatList from "./components/ChatList";
import { mockChats } from "./mockData";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

export default function ChatScreen() {
  const { isAuthenticated } = useAuthStore();

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

  return <ChatList data={mockChats} />;
}
