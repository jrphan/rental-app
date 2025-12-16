import { View, Text } from "react-native";
import { User } from "@/types/auth.types";

interface ProfileInfoCardProps {
  user: User | null;
}

export default function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  return (
    <View className="bg-white rounded-2xl mb-4 p-4 border border-gray-200">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-gray-600">Email</Text>
        <Text className="text-sm font-semibold text-gray-900">
          {user?.email || "Không có email"}
        </Text>
      </View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-gray-600">Trạng thái xác thực</Text>
        <View className="flex-row items-center">
          <View
            className={`w-2.5 h-2.5 rounded-full mr-2 ${
              user?.isPhoneVerified ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <Text className="text-sm font-semibold text-gray-900">
            {user?.isPhoneVerified ? "Đã xác thực" : "Chưa xác thực"}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-sm text-gray-600">Vai trò</Text>
        <Text className="text-sm font-semibold text-gray-900">
          {user?.role === "USER"
            ? "Người dùng"
            : user?.role === "ADMIN"
            ? "Quản trị viên"
            : "Hỗ trợ"}
        </Text>
      </View>
      {user?.createdAt && (
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-gray-600">Ngày tạo</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>
      )}
    </View>
  );
}
