import { ScrollView, TouchableOpacity, Alert, Text, View } from "react-native";
import { Link } from "expo-router";
import { HelloWave } from "@/components/hello-wave";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <View className="bg-blue-500 px-6 py-12">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-4xl font-bold text-white">Chào mừng!</Text>
          <HelloWave />
        </View>
        <Text className="text-blue-100 text-lg">
          Ứng dụng thuê phòng hiện đại với Tailwind CSS
        </Text>
      </View>

      {/* Stats Cards */}
      <View className="px-6 py-6">
        <View className="flex-row justify-between mb-6">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-1 mr-3 shadow-lg">
            <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              1,234
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">
              Phòng có sẵn
            </Text>
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-1 ml-3 shadow-lg">
            <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
              567
            </Text>
            <Text className="text-gray-600 dark:text-gray-300 text-sm">
              Đã thuê
            </Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View className="space-y-4">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
                <Text className="text-blue-600 dark:text-blue-400 text-xl">
                  🏠
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tìm phòng
                </Text>
                <Text className="text-gray-600 dark:text-gray-300 text-sm">
                  Khám phá các phòng trọ phù hợp
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-3 px-4"
              onPress={() =>
                Alert.alert("Tìm phòng", "Tính năng đang phát triển!")
              }
            >
              <Text className="text-white text-center font-medium">
                Bắt đầu tìm kiếm
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full items-center justify-center mr-4">
                <Text className="text-green-600 dark:text-green-400 text-xl">
                  📋
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Đăng tin
                </Text>
                <Text className="text-gray-600 dark:text-gray-300 text-sm">
                  Chia sẻ phòng trọ của bạn
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-green-500 rounded-lg py-3 px-4"
              onPress={() =>
                Alert.alert("Đăng tin", "Tính năng đang phát triển!")
              }
            >
              <Text className="text-white text-center font-medium">
                Đăng tin ngay
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full items-center justify-center mr-4">
                <Text className="text-purple-600 dark:text-purple-400 text-xl">
                  💬
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                  Liên hệ
                </Text>
                <Text className="text-gray-600 dark:text-gray-300 text-sm">
                  Hỗ trợ 24/7
                </Text>
              </View>
            </View>
            <Link href="/modal" asChild>
              <TouchableOpacity className="bg-purple-500 rounded-lg py-3 px-4">
                <Text className="text-white text-center font-medium">
                  Liên hệ ngay
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-8">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Thao tác nhanh
          </Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="bg-gray-200 dark:bg-gray-700 rounded-lg py-3 px-4 flex-1">
              <Text className="text-gray-700 dark:text-gray-300 text-center font-medium">
                🔍 Tìm kiếm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-200 dark:bg-gray-700 rounded-lg py-3 px-4 flex-1">
              <Text className="text-gray-700 dark:text-gray-300 text-center font-medium">
                ⭐ Yêu thích
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-200 dark:bg-gray-700 rounded-lg py-3 px-4 flex-1">
              <Text className="text-gray-700 dark:text-gray-300 text-center font-medium">
                📱 Thông báo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-8 mb-6">
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
            Được xây dựng với ❤️ bằng React Native + Tailwind CSS
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
