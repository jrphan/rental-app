import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
}

const mockChats: ChatItem[] = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    lastMessage: "Xe của bạn còn không?",
    time: "10:30",
    unread: 2,
  },
  {
    id: "2",
    name: "Trần Thị B",
    lastMessage: "Cảm ơn bạn nhé!",
    time: "09:15",
    unread: 0,
  },
  {
    id: "3",
    name: "Lê Văn C",
    lastMessage: "Tôi sẽ đến vào 2h chiều",
    time: "Hôm qua",
    unread: 1,
  },
  {
    id: "4",
    name: "Phạm Thị D",
    lastMessage: "Đã nhận được tiền cọc",
    time: "Hôm qua",
    unread: 0,
  },
  {
    id: "5",
    name: "Hoàng Văn E",
    lastMessage: "Xe đang ở đâu vậy?",
    time: "2 ngày trước",
    unread: 0,
  },
];

export default function ChatTab() {
  const renderChatItem = ({ item }: { item: ChatItem }) => {
    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100 active:bg-gray-50"
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
          <Text className="text-primary-600 font-semibold text-base">
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-xs text-gray-500">{item.time}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View className="ml-2 bg-primary-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                <Text className="text-white text-xs font-semibold">
                  {item.unread > 9 ? "9+" : item.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={mockChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
