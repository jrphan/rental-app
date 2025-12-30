import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { apiChat, type ChatMessage } from "@/services/api.chat";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatTimeAgo } from "@/utils/date.utils";
import HeaderBase from "@/components/header/HeaderBase";
import SocketDebugPanel from "@/components/chat/SocketDebugPanel";

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [hasScrolledToTop, setHasScrolledToTop] = useState(false);
  const previousMessagesLengthRef = useRef(0);
  const scrollOffsetBeforeLoadRef = useRef<number | null>(null);
  const isMaintainingScrollPositionRef = useRef(false);

  const { data: chatDetail, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat", chatId, "detail"],
    queryFn: () => apiChat.getChatDetail(chatId!),
    enabled: !!chatId,
  });

  // Infinite query for lazy loading messages (20 per page)
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat", chatId, "messages"],
    queryFn: ({ pageParam = 1 }) =>
      apiChat.getMessages(chatId!, { page: pageParam, limit: 50 }),
    enabled: !!chatId,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has messages, there might be more
      // Load next page if last page has full limit (20 messages)
      if (lastPage.length === 20) {
        return allPages.length + 1;
      }
      return undefined; // No more pages
    },
  });

  // Flatten all pages into a single array
  // Backend returns each page as [oldest...newest] within the page
  // Pages are ordered: page1 (newest overall), page2 (older), page3 (oldest)
  // We need to reverse the pages array to get [oldest...newest] overall
  const messages = useMemo(
    () => messagesData?.pages.slice().reverse().flat() || [],
    [messagesData?.pages]
  );

  // Maintain scroll position when loading older messages
  // Use onContentSizeChange to track actual content height changes
  const contentHeightRef = useRef<number | null>(null);
  const previousMessagesLengthForScrollRef = useRef(0);

  const handleContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      // If we're waiting to restore scroll position and messages count increased
      if (
        scrollOffsetBeforeLoadRef.current !== null &&
        messages.length > previousMessagesLengthForScrollRef.current
      ) {
        // First call: store current content height
        if (contentHeightRef.current === null) {
          contentHeightRef.current = contentHeight;
          previousMessagesLengthForScrollRef.current = messages.length;
          return;
        }

        // Second call (after new messages rendered): restore scroll position
        const heightDifference = contentHeight - contentHeightRef.current;

        // New messages are added at the beginning, so we need to add the height difference
        const newScrollOffset =
          scrollOffsetBeforeLoadRef.current + heightDifference;

        // Restore scroll position
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: newScrollOffset,
            animated: false,
          });
          scrollOffsetBeforeLoadRef.current = null;
          contentHeightRef.current = null;
          // Reset flag after restoring scroll position
          isMaintainingScrollPositionRef.current = false;
        }, 50);
      }
    },
    [messages.length]
  );

  useEffect(() => {
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Note: We only use WebSocket to send messages to avoid duplicates
  // WebSocket already handles persistence on the backend

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
        queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
          ["chat", chatId, "messages"],
          (old) => {
            if (!old || !old.pages.length) {
              return {
                pages: [[newMessage]],
                pageParams: [1],
              };
            }

            // Flatten all pages to check for duplicates and temp messages
            const allMessages = old.pages.flat();

            // Check if message already exists (by ID)
            if (allMessages.some((m) => m.id === newMessage.id)) {
              return old;
            }

            // Find temp message with same content and sender
            let tempMessageFound = false;
            const updatedPages = old.pages.map((page) => {
              const tempIndex = page.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.content === newMessage.content &&
                  m.senderId === newMessage.senderId
              );
              if (tempIndex !== -1) {
                tempMessageFound = true;
                const newPage = [...page];
                newPage[tempIndex] = newMessage;
                return newPage;
              }
              return page;
            });

            if (tempMessageFound) {
              return {
                pages: updatedPages,
                pageParams: old.pageParams,
              };
            }

            // Otherwise, add new message to the first page (newest messages)
            const newPages = [...old.pages];
            newPages[0] = [newMessage, ...newPages[0]];

            return {
              pages: newPages,
              pageParams: old.pageParams,
            };
          }
        );
        // Scroll to bottom (only if not maintaining scroll position)
        if (!isMaintainingScrollPositionRef.current) {
          scrollToBottom(true);
        }
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

  // Scroll to bottom when messages load or screen is focused
  const scrollToBottom = useCallback(
    (animated = false) => {
      // Don't scroll to bottom if we're maintaining scroll position (loading older messages)
      if (isMaintainingScrollPositionRef.current) {
        return;
      }
      if (flatListRef.current && messages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated });
        }, 100);
      }
    },
    [messages.length]
  );

  useEffect(() => {
    // Scroll to bottom when messages load (but not when maintaining scroll position)
    if (!isMaintainingScrollPositionRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  // Scroll to bottom when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Delay để đảm bảo FlatList đã render xong
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 300);
      return () => clearTimeout(timer);
    }, [scrollToBottom])
  );

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const messageContent = message.trim();
    setMessage("");

    // Optimistically add temp message for instant UI update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
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

    // Add temp message to infinite query structure (first page = newest messages)
    queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
      ["chat", chatId, "messages"],
      (old) => {
        if (!old || !old.pages.length) {
          return {
            pages: [[tempMessage]],
            pageParams: [1],
          };
        }

        const newPages = [...old.pages];
        // Add to first page (newest messages)
        newPages[0] = [...newPages[0], tempMessage];

        return {
          pages: newPages,
          pageParams: old.pageParams,
        };
      }
    );

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(true), 50);

    // Send via WebSocket - will replace temp message when real message arrives
    sendMessageWS(messageContent);
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

  const handleTitlePress = () => {
    // Navigate to owner profile
    const params = new URLSearchParams({
      ownerName: otherUser.fullName || "Người dùng",
    });
    if (otherUser.avatar) params.append("ownerAvatar", otherUser.avatar);
    router.push(`/owner/${otherUser.id}?${params.toString()}`);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <View className="bg-white">
        <HeaderBase
          title={otherUser.fullName || "Người dùng"}
          showBackButton
          onTitlePress={handleTitlePress}
          action={
            <Text className="text-sm text-gray-500">
              {chatDetail.vehicle.brand} {chatDetail.vehicle.model}
            </Text>
          }
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted={false}
        onScroll={(event) => {
          const { contentOffset } = event.nativeEvent;
          // Load more when scrolled near top (within 200px)
          if (
            contentOffset.y <= 200 &&
            hasNextPage &&
            !isFetchingNextPage &&
            !hasScrolledToTop
          ) {
            setHasScrolledToTop(true);
            // Mark that we're maintaining scroll position
            isMaintainingScrollPositionRef.current = true;
            // Store current scroll offset and reset content height ref
            scrollOffsetBeforeLoadRef.current = contentOffset.y;
            contentHeightRef.current = null; // Reset to track new content height

            fetchNextPage().finally(() => {
              // Reset after a delay to allow loading again
              setTimeout(() => setHasScrolledToTop(false), 1000);
            });
          }
        }}
        scrollEventThrottle={400}
        ListHeaderComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text className="text-xs text-gray-500 mt-2">
                Đang tải tin nhắn cũ hơn...
              </Text>
            </View>
          ) : null
        }
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
                    ? "rounded-br-sm"
                    : "bg-white rounded-bl-sm border border-gray-200"
                }`}
                style={
                  isMyMessage ? { backgroundColor: COLORS.primary } : undefined
                }
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
                    isMyMessage ? "text-white opacity-90" : "text-gray-500"
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={handleContentSizeChange}
      />

      {/* Input - Sticky với keyboard */}
      <KeyboardStickyView>
        <View
          className="bg-white border-t border-gray-200 px-4 flex-row items-center"
          style={{ paddingBottom: insets.bottom || 12, paddingTop: 12 }}
        >
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
            disabled={!message.trim()}
            className={`rounded-full p-2 ${
              message.trim() ? "bg-orange-500" : "bg-gray-300"
            }`}
            style={{
              backgroundColor: message.trim() ? COLORS.primary : "#D1D5DB",
            }}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardStickyView>

      {/* Socket Debug Panel - Only in development */}
      {__DEV__ && <SocketDebugPanel chatId={chatId} enabled={!!chatId} />}
    </SafeAreaView>
  );
}
