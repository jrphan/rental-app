import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiChat, type ChatMessage } from "@/services/api.chat";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatTimeAgo } from "@/utils/date.utils";
import SocketDebugPanel from "@/components/chat/SocketDebugPanel";
import HeaderBase from "@/components/header/HeaderBase";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const tempMessageIdRef = useRef<string | null>(null);

  const { data: chatDetail, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat", chatId, "detail"],
    queryFn: () => apiChat.getChatDetail(chatId!),
    enabled: !!chatId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", chatId, "messages"],
    queryFn: () => apiChat.getMessages(chatId!, { page: 1, limit: 100 }),
    enabled: !!chatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => apiChat.sendMessage(chatId!, content),
    // onSuccess is handled in handleSendMessage to prevent duplicates
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
            // If we have a temp message and this is our message, replace it
            if (tempMessageIdRef.current && newMessage.senderId === user?.id) {
              // Remove temp message and add real message
              const filtered = old.filter(
                (m) => m.id !== tempMessageIdRef.current
              );
              tempMessageIdRef.current = null;
              return [...filtered, newMessage];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const messageContent = message.trim();
    setMessage("");

    // Optimistically add message
    const tempId = `temp-${Date.now()}`;
    tempMessageIdRef.current = tempId;
    const tempMessage: ChatMessage = {
      id: tempId,
      chatId: chatId!,
      senderId: user?.id || "",
      content: messageContent,
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
    sendMessageWS(messageContent);

    // Also send via API (for persistence) - but don't refetch to avoid duplicates
    sendMessageMutation.mutate(messageContent, {
      onSuccess: () => {
        // Don't refetch here, let WebSocket handle the update
        // This prevents duplicate messages
      },
    });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (isLoadingChat) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="mt-4 text-gray-600">Đang tải...</Text>
      </SafeAreaView>
    );
  }

  if (!chatDetail) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-gray-50 px-6"
        edges={["top", "left", "right"]}
      >
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
      </SafeAreaView>
    );
  }

  const otherUser =
    chatDetail.renter.id === user?.id ? chatDetail.owner : chatDetail.renter;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="bg-white">
          <HeaderBase
            title={otherUser.fullName || "Người dùng"}
            showBackButton
            action={
              <Text className="text-sm text-gray-500">
                {chatDetail.vehicle.brand} {chatDetail.vehicle.model}
              </Text>
            }
          />
        </View>

        {/* Messages */}
        <View style={{ flex: 1 }}>
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
        </View>

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
    </SafeAreaView>
  );
}
