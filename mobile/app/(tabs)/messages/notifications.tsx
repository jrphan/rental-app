import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, Notification } from "@/services/api.notifications";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useToast } from "@/hooks/useToast";
import { COLORS } from "@/constants/colors";

export default function NotificationsTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread">("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", selectedFilter],
    queryFn: () =>
      notificationsApi.getMyNotifications({
        page: 1,
        limit: 50,
        isRead: selectedFilter === "unread" ? false : undefined,
      }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.showSuccess("Đã đánh dấu tất cả là đã đọc", {
        title: "Thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      toast.showSuccess("Đã xóa thông báo", { title: "Thành công" });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Xóa thông báo thất bại", { title: "Lỗi" });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (notification: Notification) => {
    Alert.alert("Xóa thông báo", "Bạn có chắc muốn xóa thông báo này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => deleteMutation.mutate(notification.id),
      },
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "RENTAL_REQUEST":
      case "RENTAL_CONFIRMED":
        return "directions-bike";
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return "payment";
      case "REVIEW_RECEIVED":
        return "star";
      case "MESSAGE_RECEIVED":
        return "chat-bubble";
      case "SYSTEM_ANNOUNCEMENT":
        return "notifications";
      case "DISPUTE_CREATED":
      case "DISPUTE_RESOLVED":
        return "gavel";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "RENTAL_CONFIRMED":
      case "PAYMENT_SUCCESS":
        return "#22C55E";
      case "PAYMENT_FAILED":
      case "RENTAL_CANCELLED":
        return "#EF4444";
      case "MESSAGE_RECEIVED":
        return "#3B82F6";
      default:
        return COLORS.primary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconColor = getNotificationColor(item.type);
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        className={`bg-white border-b border-gray-100 px-4 py-3 ${
          isUnread ? "bg-orange-50" : ""
        }`}
        onPress={() => {
          if (!item.isRead) {
            markAsReadMutation.mutate(item.id);
          }
        }}
        onLongPress={() => handleDelete(item)}
      >
        <View className="flex-row">
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
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className={`text-sm font-semibold flex-1 ${
                  isUnread ? "text-gray-900" : "text-gray-700"
                }`}
              >
                {item.title}
              </Text>
              {isUnread && (
                <View className="w-2 h-2 rounded-full bg-orange-600 ml-2" />
              )}
            </View>
            <Text
              className={`text-sm mb-1 ${
                isUnread ? "text-gray-800" : "text-gray-600"
              }`}
            >
              {item.message}
            </Text>
            <Text className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleString("vi-VN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Đang tải...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter and Actions */}
      <View className="bg-white border-b border-gray-200 px-4 py-2 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-3 py-1 rounded-full ${
              selectedFilter === "all" ? "bg-orange-600" : "bg-gray-100"
            }`}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedFilter === "all" ? "text-white" : "text-gray-700"
              }`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-3 py-1 rounded-full ${
              selectedFilter === "unread" ? "bg-orange-600" : "bg-gray-100"
            }`}
            onPress={() => setSelectedFilter("unread")}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedFilter === "unread" ? "text-white" : "text-gray-700"
              }`}
            >
              Chưa đọc
            </Text>
          </TouchableOpacity>
        </View>
        {data && data.data.some((n) => !n.isRead) && (
          <TouchableOpacity
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text className="text-xs text-orange-600 font-semibold">
              Đọc tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {!data || data.data.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="notifications-none" size={64} color="#D1D5DB" />
          <Text className="mt-4 text-lg font-semibold text-gray-900">
            {selectedFilter === "unread"
              ? "Không có thông báo chưa đọc"
              : "Chưa có thông báo"}
          </Text>
          <Text className="mt-2 text-sm text-gray-600 text-center">
            {selectedFilter === "unread"
              ? "Tất cả thông báo đã được đọc"
              : "Bạn sẽ nhận được thông báo khi có hoạt động mới"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.data}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
