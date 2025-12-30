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

// Estimated message height for getItemLayout optimization
const ESTIMATED_MESSAGE_HEIGHT = 80;

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const isLoadingOlderRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const previousMessagesCountRef = useRef(0);

  const { data: chatDetail, isLoading: isLoadingChat } = useQuery({
    queryKey: ["chat", chatId, "detail"],
    queryFn: () => apiChat.getChatDetail(chatId!),
    enabled: !!chatId,
  });

  // Infinite query for lazy loading messages
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
      // Load next page if last page has full limit (50 messages)
      if (lastPage.length === 50) {
        return allPages.length + 1;
      }
      return undefined; // No more pages
    },
  });

  // Flatten and sort messages properly
  // Backend returns: page1 (newest), page2 (older), page3 (oldest)
  // Each page is already reversed by backend: [oldest...newest] within page
  // We need: [oldest...newest] overall
  const messages = useMemo(() => {
    if (!messagesData?.pages.length) return [];

    // Reverse pages array to get oldest first, then flatten
    const allMessages = messagesData.pages.slice().reverse().flat();

    // Sort by createdAt to ensure correct order (defensive)
    return allMessages.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messagesData?.pages]);

  // Track message count changes
  useEffect(() => {
    const currentCount = messages.length;
    const previousCount = previousMessagesCountRef.current;

    // If new messages added at the end (newer messages), scroll to bottom
    if (currentCount > previousCount && shouldScrollToBottomRef.current) {
      // Only auto-scroll if user is near bottom or it's initial load
      if (isInitialLoadRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          isInitialLoadRef.current = false;
        }, 100);
      }
    }

    previousMessagesCountRef.current = currentCount;
  }, [messages.length]);

  const markAsReadMutation = useMutation({
    mutationFn: () => apiChat.markAsRead(chatId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // WebSocket connection with optimized message handling
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

            // Check all pages for duplicates
            const allMessages = old.pages.flat();
            if (allMessages.some((m) => m.id === newMessage.id)) {
              return old; // Already exists
            }

            // Find and replace temp message
            let tempMessageFound = false;
            const updatedPages = old.pages.map((page) => {
              const tempIndex = page.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.content === newMessage.content &&
                  m.senderId === newMessage.senderId &&
                  Math.abs(
                    new Date(m.createdAt).getTime() -
                      new Date(newMessage.createdAt).getTime()
                  ) < 5000 // Within 5 seconds
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

            // Add new message to the first page (newest page)
            // Since pages are [newest, older, oldest], we add to page 0
            const newPages = [...old.pages];
            if (newPages[0]) {
              newPages[0] = [...newPages[0], newMessage];
            } else {
              newPages[0] = [newMessage];
            }

            return {
              pages: newPages,
              pageParams: old.pageParams,
            };
          }
        );

        // Auto-scroll to bottom for new messages (only if user is near bottom)
        shouldScrollToBottomRef.current = true;
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    });

  // Mark messages as read when screen is focused
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markAsReadMutation.mutate();
      markAsReadWS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, messages.length]);

  // Scroll to bottom when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (messages.length > 0) {
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
          isInitialLoadRef.current = false;
        }, 200);
        return () => clearTimeout(timer);
      }
    }, [messages.length])
  );

  // Handle scroll events to detect if user is near bottom
  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;

      // User is near bottom (within 200px) - auto-scroll for new messages
      shouldScrollToBottomRef.current = distanceFromBottom < 200;

      // Load older messages when near top
      if (
        contentOffset.y < 300 &&
        hasNextPage &&
        !isFetchingNextPage &&
        !isLoadingOlderRef.current
      ) {
        isLoadingOlderRef.current = true;
        setIsLoadingOlder(true);
        fetchNextPage().finally(() => {
          setTimeout(() => {
            isLoadingOlderRef.current = false;
            setIsLoadingOlder(false);
          }, 500);
        });
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
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

    // Add temp message to infinite query structure
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
        // Add to first page (newest messages page)
        if (newPages[0]) {
          newPages[0] = [...newPages[0], tempMessage];
        } else {
          newPages[0] = [tempMessage];
        }

        return {
          pages: newPages,
          pageParams: old.pageParams,
        };
      }
    );

    // Scroll to bottom immediately
    shouldScrollToBottomRef.current = true;
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Send via WebSocket - will replace temp message when real message arrives
    sendMessageWS(messageContent);
  };

  // Optimize FlatList with getItemLayout
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ESTIMATED_MESSAGE_HEIGHT,
      offset: ESTIMATED_MESSAGE_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoize render item for performance
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMyMessage = item.senderId === user?.id;
      return (
        <View
          className={`px-4 py-2 ${isMyMessage ? "items-end" : "items-start"}`}
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
    },
    [user?.id]
  );

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
          // action={
          //   <Text className="text-sm text-gray-500">
          //     {chatDetail.vehicle.brand} {chatDetail.vehicle.model}
          //   </Text>
          // }
        />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        inverted={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={renderMessage}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        ListHeaderComponent={
          isFetchingNextPage || isLoadingOlder ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text className="text-xs text-gray-500 mt-2">
                Đang tải tin nhắn cũ hơn...
              </Text>
            </View>
          ) : null
        }
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
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
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
