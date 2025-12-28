import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiChat,
  type ChatMessage,
  type ChatDetail,
} from "@/services/api.chat";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatTimeAgo } from "@/utils/date.utils";
import SocketDebugPanel from "@/components/chat/SocketDebugPanel";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: chatDetail, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat", chatId, "detail"],
    queryFn: () => apiChat.getChatDetail(chatId!),
    enabled: !!chatId,
  });

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["chat", chatId, "messages"],
    queryFn: () => apiChat.getMessages(chatId!, { page: 1, limit: 100 }),
    enabled: !!chatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiChat.sendMessage(chatId!, content),
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: () => apiChat.markAsRead(chatId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chat", chatId, "messages"] });
    },
  });

  // WebSocket connection
  const { sendMessage: sendMessageWS, markAsRead: markAsReadWS } =
    useChatSocket({
      enabled: !!chatId,
      chatId: chatId!,
      onNewMessage: (newMessage) => {
        queryClient.setQueryData<ChatMessage[]>(
          ["chat", chatId, "messages"],
          (old) => {
            if (!old) return [newMessage];
            // Check if message already exists
            if (old.some((m) => m.id === newMessage.id)) {
              return old;
            }
            return [...old, newMessage];
          }
        );
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    });

  useEffect(() => {
    // Mark messages as read when screen is focused
    if (chatId && messages.length > 0) {
      markAsReadMutation.mutate();
      markAsReadWS();
    }
  }, [chatId, messages.length]);

  useEffect(() => {
    // Scroll to bottom when messages load
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    // Optimistically add message
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: chatId!,
      senderId: user?.id || "",
      content: message.trim(),
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: {
        id: user?.id || "",
        fullName: user?.fullName || null,
        avatar: user?.avatar || null,
      },
    };

    queryClient.setQueryData<ChatMessage[]>(
      ["chat", chatId, "messages"],
      (old) => [...(old || []), tempMessage]
    );

    // Send via WebSocket first (faster)
    sendMessageWS(message.trim());

    // Also send via API (for persistence)
    sendMessageMutation.mutate(message.trim());
    setMessage("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (isLoadingChat) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Đang tải...</Text>
      </View>
    );
  }

  if (!chatDetail) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <MaterialIcons name="error-outline" size={64} color="#EF4444" />
        <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">
          Không tìm thấy cuộc hội thoại
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-orange-600 rounded-xl px-6 py-3"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Text className="text-white font-semibold text-base">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const otherUser =
    chatDetail.renter.id === user?.id ? chatDetail.owner : chatDetail.renter;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {otherUser.fullName || "Người dùng"}
          </Text>
          <Text className="text-sm text-gray-500">
            {chatDetail.vehicle.brand} {chatDetail.vehicle.model}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMyMessage = item.senderId === user?.id;
          return (
            <View
              className={`px-4 py-2 ${
                isMyMessage ? "items-end" : "items-start"
              }`}
            >
              <View
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMyMessage
                    ? "bg-orange-500 rounded-br-sm"
                    : "bg-white rounded-bl-sm border border-gray-200"
                }`}
              >
                <Text
                  className={`text-base ${
                    isMyMessage ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.content}
                </Text>
                <Text
                  className={`text-xs mt-1 ${
                    isMyMessage ? "text-orange-100" : "text-gray-500"
                  }`}
                >
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-base">
              Chưa có tin nhắn nào
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* Input */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 flex-row items-center">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
          multiline
          maxLength={5000}
        />
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
          className={`rounded-full p-2 ${
            message.trim() ? "bg-orange-500" : "bg-gray-300"
          }`}
          style={{
            backgroundColor: message.trim() ? COLORS.primary : "#D1D5DB",
          }}
        >
          {sendMessageMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Socket Debug Panel - Only in development */}
      {__DEV__ && <SocketDebugPanel chatId={chatId} enabled={!!chatId} />}
    </KeyboardAvoidingView>
  );
}
