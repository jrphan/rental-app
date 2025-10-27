import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ExploreScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Header with Search */}
      <View className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4">
        <Text className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Khám phá
        </Text>
        <View className="flex-row items-center rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-3">
          <IconSymbol name="magnifyingglass" size={20} color="#6B7280" />
          <TextInput
            placeholder="Tìm kiếm phòng trọ..."
            className="ml-3 flex-1 text-base text-gray-900 dark:text-white"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200 dark:border-gray-700 px-6">
        <View className="flex-row gap-3 py-4">
          <TouchableOpacity className="rounded-full bg-blue-600 px-6 py-2">
            <Text className="font-medium text-white">Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full bg-gray-100 dark:bg-gray-800 px-6 py-2">
            <Text className="font-medium text-gray-700 dark:text-gray-300">Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full bg-gray-100 dark:bg-gray-800 px-6 py-2">
            <Text className="font-medium text-gray-700 dark:text-gray-300">1 phòng ngủ</Text>
          </TouchableOpacity>
          <TouchableOpacity className="rounded-full bg-gray-100 dark:bg-gray-800 px-6 py-2">
            <Text className="font-medium text-gray-700 dark:text-gray-300">2 phòng ngủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Content */}
      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        <Text className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Kết quả tìm kiếm
        </Text>
        
        {/* Empty State */}
        <View className="items-center justify-center py-20">
          <IconSymbol name="house" size={80} color="#9CA3AF" />
          <Text className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
            Chưa có kết quả nào
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Hãy thử tìm kiếm với từ khóa khác
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
