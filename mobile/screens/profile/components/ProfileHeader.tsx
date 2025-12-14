import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

interface ProfileHeaderProps {
  profile?: {
    avatar?: string | null;
    firstName?: string;
    lastName?: string;
  } | null;
  user: {
    email?: string;
    phone?: string;
    isPhoneVerified?: boolean;
  } | null;
}

export default function ProfileHeader({ profile, user }: ProfileHeaderProps) {
  return (
    <View className="items-center pt-8 pb-6 mb-6">
      <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
        {profile?.avatar ? (
          <MaterialIcons name="person" size={48} color={COLORS.primary} />
        ) : (
          <MaterialIcons name="person" size={48} color={COLORS.primary} />
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
        <View className="flex-row items-center mt-1">
          <Text className="text-base text-gray-600">{user.phone}</Text>
          {user?.isPhoneVerified && (
            <MaterialIcons
              name="verified"
              size={18}
              color="#22c55e"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      )}
    </View>
  );
}
