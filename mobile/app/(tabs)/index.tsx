import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 px-6 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Chào mừng trở lại,
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.email?.split("@")[0] || "Người dùng"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-full bg-gray-100 dark:bg-gray-700 p-3"
          >
            <IconSymbol name="power" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6">
          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Thao tác nhanh
            </Text>
            <View className="flex-row flex-wrap gap-4">
              <TouchableOpacity className="flex-1 min-w-[45%] rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <IconSymbol name="house.fill" size={28} color="#2563EB" />
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  Tìm phòng trọ
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Tìm kiếm và lọc
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 min-w-[45%] rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <IconSymbol name="plus" size={28} color="#10B981" />
                </View>
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  Đăng tin
                </Text>
                <Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Cho thuê phòng
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Info Card */}
          <View className="mb-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <Text className="mb-2 text-white/80">Thông tin tài khoản</Text>
            <Text className="text-lg font-semibold text-white">
              {user?.email}
            </Text>
            <Text className="mt-1 text-sm text-white/80">
              Vai trò: {user?.role === "RENTER" ? "Người thuê" : "Chủ nhà"}
            </Text>
          </View>

          {/* Stats */}
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Thống kê
            </Text>
            <View className="flex-row gap-4">
              <View className="flex-1 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
                <IconSymbol name="eye" size={24} color="#6366F1" />
                <Text className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  0
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  Đã xem
                </Text>
              </View>
              <View className="flex-1 rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
                <IconSymbol name="heart" size={24} color="#EF4444" />
                <Text className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  0
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  Yêu thích
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
