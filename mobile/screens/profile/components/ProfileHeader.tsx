import { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { User } from "@/types/auth.types";
import { Image } from "expo-image";

interface ProfileHeaderProps {
  user: User | null;
}

function ProfileHeaderComponent({ user }: ProfileHeaderProps) {
  const displayName = useMemo(() => {
    if (!user) return "Người dùng";
    if (user.fullName) return user.fullName;
    return user.email || "Người dùng";
  }, [user]);

  const shouldShowPhone = Boolean(user?.phone);
  const isPhoneVerified = Boolean(user?.isPhoneVerified);

  return (
    <View className="items-center pt-8 pb-6 mb-6">
      <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            className="w-24 h-24 rounded-full"
          />
        ) : (
          <MaterialIcons name="person" size={48} color={COLORS.primary} />
        )}
      </View>
      <Text className="text-2xl font-bold text-gray-900">{displayName}</Text>
      {user?.email && (
        <Text className="mt-1 text-base text-gray-600">{user.email}</Text>
      )}
      {shouldShowPhone && user && (
        <View className="flex-row items-center mt-1">
          <Text className="text-base text-gray-600">{user.phone}</Text>
          {isPhoneVerified && (
            <MaterialIcons
              name="verified"
              size={18}
              color="#22c55e"
              style={styles.verifiedIcon}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  verifiedIcon: {
    marginLeft: 4,
  },
});

const ProfileHeader = memo(ProfileHeaderComponent);

export default ProfileHeader;
