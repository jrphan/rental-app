import { View, Text } from "react-native";

interface ProfileInfoCardProps {
  profile?: {
    dateOfBirth?: string | null;
    gender?: "MALE" | "FEMALE" | string | null;
  } | null;
  user: {
    isVerified?: boolean;
    isPhoneVerified?: boolean;
    role?: string;
    phone?: string;
  } | null;
}

export default function ProfileInfoCard({
  profile,
  user,
}: ProfileInfoCardProps) {
  return (
    <View className="bg-gray-50 rounded-2xl mb-4 p-4">
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
      {user?.phone && (
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-gray-600">Xác minh số điện thoại</Text>
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
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
  );
}
