import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api.profile";
import { useToast } from "@/lib/toast";
import { queryKeys } from "@/lib/queryClient";

export default function ProfileScreen() {
  const { logout, user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.showSuccess("Đã đăng xuất thành công", { title: "Đăng xuất" });
  };

  // Fetch profile data if authenticated
  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile.detail(user?.id),
    queryFn: () => profileApi.getProfile(),
    enabled: !!user?.id && isAuthenticated,
  });

  const profile = profileData?.profile;

  // Not authenticated - show login/register options
  if (!isAuthenticated) {
    return (
      <SafeAreaView
        className="flex-1 bg-white px-6"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
              <MaterialIcons name="person-outline" size={40} color="#EA580C" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              Chào mừng bạn!
            </Text>
            <Text className="mt-2 text-base text-gray-600 text-center">
              Đăng nhập hoặc đăng ký để sử dụng đầy đủ các tính năng của ứng
              dụng
            </Text>
          </View>

          <View className="w-full gap-4">
            <Button
              onPress={() => router.push("/(auth)/login")}
              className="w-full"
              size="lg"
            >
              <Text className="text-center text-base font-semibold text-white">
                Đăng nhập
              </Text>
            </Button>

            <Button
              onPress={() => router.push("/(auth)/register")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Text className="text-center text-base font-semibold text-gray-900">
                Đăng ký
              </Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Authenticated - show profile
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6">
          {/* Profile Header */}
          <View className="items-center pt-8 pb-6">
            <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
              {profile?.avatar ? (
                <MaterialIcons name="person" size={48} color="#EA580C" />
              ) : (
                <MaterialIcons name="person" size={48} color="#EA580C" />
              )}
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : user?.email || "Người dùng"}
            </Text>
            {user?.email && (
              <Text className="mt-1 text-base text-gray-600">{user.email}</Text>
            )}
            {user?.phone && (
              <Text className="mt-1 text-base text-gray-600">{user.phone}</Text>
            )}
          </View>

          {/* Profile Info Card */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-600">Trạng thái xác thực</Text>
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-2 ${
                    user?.isVerified ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <Text className="text-sm font-semibold text-gray-900">
                  {user?.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-600">Vai trò</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {user?.role === "RENTER"
                  ? "Người thuê"
                  : user?.role === "OWNER"
                    ? "Chủ xe"
                    : "User"}
              </Text>
            </View>
            {profile?.dateOfBirth && (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-600">Ngày sinh</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            )}
            {profile?.gender && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Giới tính</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {profile.gender === "MALE"
                    ? "Nam"
                    : profile.gender === "FEMALE"
                      ? "Nữ"
                      : "Khác"}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Cài đặt
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/edit-profile")}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
            >
              <View className="flex-row items-center">
                <MaterialIcons name="edit" size={24} color="#EA580C" />
                <Text className="ml-3 text-base font-medium text-gray-900">
                  Chỉnh sửa hồ sơ
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/change-password")}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
            >
              <View className="flex-row items-center">
                <MaterialIcons name="lock" size={24} color="#EA580C" />
                <Text className="ml-3 text-base font-medium text-gray-900">
                  Đổi mật khẩu
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/kyc")}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
            >
              <View className="flex-row items-center">
                <MaterialIcons name="verified-user" size={24} color="#EA580C" />
                <Text className="ml-3 text-base font-medium text-gray-900">
                  Xác thực danh tính (KYC)
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Bio Section */}
          {profile?.bio && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Giới thiệu
              </Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <Text className="text-base text-gray-700">{profile.bio}</Text>
              </View>
            </View>
          )}

          {/* Address Section */}
          {profile?.address && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Địa chỉ
              </Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <Text className="text-base text-gray-700">
                  {profile.address}
                </Text>
              </View>
            </View>
          )}

          {/* Logout Button */}
          <Button
            onPress={handleLogout}
            variant="destructive"
            className="mb-24 mt-4"
            size="lg"
          >
            <Text className="text-center text-base font-semibold text-white">
              Đăng xuất
            </Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
