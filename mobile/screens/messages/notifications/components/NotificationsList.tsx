import React from "react";
import { View, Text, FlatList } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import NotificationItem from "./NotificationItem";
import type { NotificationItem as NotificationItemType } from "../types";

interface NotificationsListProps {
  data: NotificationItemType[];
  onItemAction?: (action: string, item: NotificationItemType) => void;
  onRefresh?: () => void;
}

export default function NotificationsList({
  data,
  onItemAction,
  onRefresh,
}: NotificationsListProps) {
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <NotificationItem item={item} onAction={onItemAction} />
        )}
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
}
