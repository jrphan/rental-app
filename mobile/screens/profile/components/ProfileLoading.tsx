import { View, Text, ActivityIndicator } from "react-native";
import { COLORS } from "@/constants/colors";

export default function ProfileLoading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text className="mt-4 text-base text-gray-600">Đang tải thông tin...</Text>
    </View>
  );
}

