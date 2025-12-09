import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { messagesApi, Conversation } from "@/services/api.messages";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

export default function ChatTab() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations({ page: 1, limit: 50 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Check phone verification
  // if (!requirePhoneVerification()) {
  //   return null;
  // }

  const renderConversation = ({ item }: { item: Conversation }) => {
    const userName =
      item.user.profile?.firstName && item.user.profile?.lastName
        ? `${item.user.profile.firstName} ${item.user.profile.lastName}`
        : item.user.email.split("@")[0];

    const lastMessage = item.lastMessage;
    const isMyMessage = lastMessage?.senderId === item.userId;

    return (
      <TouchableOpacity
        className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center"
        onPress={() => {
          // TODO: Navigate to chat detail screen
          // router.push({
          //   pathname: "/(tabs)/messages/chat-detail",
          //   params: { userId: item.userId },
          // });
        }}
      >
        {/* Avatar */}
        {item.user.profile?.avatarUrl ? (
          <Image
            source={{ uri: item.user.profile.avatarUrl }}
            className="w-12 h-12 rounded-full mr-3"
          />
        ) : (
          <View className="w-12 h-12 rounded-full mr-3 bg-orange-100 items-center justify-center">
            <MaterialIcons name="person" size={24} color={COLORS.primary} />
          </View>
        )}

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">
              {userName}
            </Text>
            {lastMessage && (
              <Text className="text-xs text-gray-500">
                {new Date(lastMessage.createdAt).toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>
          {lastMessage && (
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
                {isMyMessage ? "Bạn: " : ""}
                {lastMessage.content}
              </Text>
              {item.unreadCount > 0 && (
                <View className="ml-2 bg-orange-600 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                  <Text className="text-xs font-semibold text-white">
                    {item.unreadCount > 99 ? "99+" : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          )}
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

  if (!data || data.data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <MaterialIcons name="chat-bubble-outline" size={64} color="#D1D5DB" />
        <Text className="mt-4 text-lg font-semibold text-gray-900">
          Chưa có cuộc trò chuyện
        </Text>
        <Text className="mt-2 text-sm text-gray-600 text-center">
          Bắt đầu trò chuyện với chủ xe hoặc người thuê để đặt xe
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data.data}
      keyExtractor={(item) => item.userId}
      renderItem={renderConversation}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
