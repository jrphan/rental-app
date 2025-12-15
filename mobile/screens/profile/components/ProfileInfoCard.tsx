import { View, Text } from "react-native";
import { User } from "@/store/auth";

interface ProfileInfoCardProps {
  profile?: {
    dateOfBirth?: string | null;
    gender?: "MALE" | "FEMALE" | string | null;
  } | null;
  user: User | null;
}

export default function ProfileInfoCard({
  profile,
  user,
}: ProfileInfoCardProps) {
  return (
    <View
      className="bg-white rounded-2xl mb-4 p-4 shadow-lg border border-gray-200"
      style={{
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
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
      {user?.phone && (
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-gray-600">Xác minh số điện thoại</Text>
          <View className="flex-row items-center">
            <View
              className={`w-2.5 h-2.5 rounded-full mr-2 ${
                user?.isPhoneVerified ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <Text className="text-sm font-semibold text-gray-900">
              {user?.isPhoneVerified ? "Đã xác minh" : "Chưa xác minh"}
            </Text>
          </View>
        </View>
      )}
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
  );
}
