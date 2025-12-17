import React from "react";
import { View, Text, FlatList } from "react-native";
import ChatItem from "./ChatItem";
import type { ChatItem as ChatItemType } from "../types";

interface ChatListProps {
  data: ChatItemType[];
  onItemAction?: (action: string, item: ChatItemType) => void;
}

export default function ChatList({ data, onItemAction }: ChatListProps) {
  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ChatItem item={item} onAction={onItemAction} />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-base">
              Không có tin nhắn nào
            </Text>
          </View>
        }
      />
    </View>
  );
}

