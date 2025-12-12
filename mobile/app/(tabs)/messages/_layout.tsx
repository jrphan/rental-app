import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, TouchableOpacity, Text, StatusBar } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import ChatTab from "./chat";
import NotificationsTab from "./notifications";
import { Tabs } from "@/components/ui/tabs";
import type { TabConfig } from "@/components/ui/tabs";

export default function MessagesLayout() {
  const router = useRouter();

  // Tabs config - mỗi tab có content riêng
  // Logic match path được xử lý tự động bên trong Tabs component
  const tabs = useMemo<TabConfig[]>(
    () => [
      {
        label: "Nhắn tin",
        value: "chat",
        route: "/(tabs)/messages/chat",
        content: <ChatTab />,
      },
      {
        label: "Thông báo",
        value: "notifications",
        route: "/(tabs)/messages/notifications",
        content: <NotificationsTab />,
      },
    ],
    []
  );

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Tin nhắn</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Custom Tabs */}
        <Tabs tabs={tabs} variant="pill" />
      </SafeAreaView>
    </>
  );
}
