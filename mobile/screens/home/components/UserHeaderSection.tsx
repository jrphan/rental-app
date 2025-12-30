import React from "react";
import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiNotification } from "@/services/api.notification";
import { COLORS } from "@/constants/colors";

export default function UserHeaderSection() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Fetch unread notification count
  const { data: unreadCountData } = useQuery({
    queryKey: ["notificationUnreadCount"],
    queryFn: () => apiNotification.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadCountData?.count || 0;

  // Show login/register buttons when not authenticated
  if (!user || !isAuthenticated) {
    return (
      <View
        className="px-4 pb-5"
        style={{
          backgroundColor: COLORS.primary,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          paddingTop: Platform.OS === "ios" ? 60 : 40,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pb-4">
            <Text className="text-white text-lg font-bold mb-1">
              Chào mừng bạn đến với dịch vụ thuê xe
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const displayName = user.fullName || user.phone || "Người dùng";

  return (
    <View
      className="px-4 pb-5"
      style={{
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingTop: Platform.OS === "ios" ? 60 : 35,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* User Info */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          className="flex-row items-center flex-1 mb-4 gap-2"
          activeOpacity={0.8}
        >
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="rounded-full mr-3"
              style={{
                borderWidth: 3,
                borderColor: "rgba(255, 255, 255, 0.4)",
                width: 56,
                height: 56,
              }}
            />
          ) : (
            <View
              className="w-14 h-14 rounded-full mr-3 items-center justify-center"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                borderWidth: 3,
                borderColor: "rgba(255, 255, 255, 0.4)",
              }}
            >
              <MaterialIcons name="account-circle" size={36} color="#FFFFFF" />
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white text-xs opacity-80 mb-0.5">
              Xin chào
            </Text>
            <Text
              className="text-white text-lg font-bold"
              numberOfLines={1}
              style={{
                textShadowColor: "rgba(0, 0, 0, 0.1)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {displayName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/messages")}
            className="relative"
            activeOpacity={0.7}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
            >
              <MaterialIcons name="notifications" size={22} color="#FFFFFF" />
            </View>
            {unreadCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: "#EF4444", height: 16, width: 16 }}
              >
                <Text className="text-white text-xs font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="settings" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
