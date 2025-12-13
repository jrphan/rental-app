import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

export default function ProfileAuthPrompt() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center">
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
          <MaterialIcons
            name="person-outline"
            size={40}
            color={COLORS.primary}
          />
        </View>
        <Text className="text-2xl font-bold text-gray-900">Chào mừng bạn!</Text>
        <Text className="mt-2 text-base text-gray-600 text-center px-8">
          Đăng nhập hoặc đăng ký để sử dụng đầy đủ các tính năng của ứng dụng
        </Text>
      </View>

      <Button
        onPress={() => router.push("/(auth)/login")}
        size="lg"
        className="w-full"
      >
        <Text className="text-center text-base font-semibold text-white">
          Đăng nhập
        </Text>
      </Button>

      <Button
        onPress={() => router.push("/(auth)/register")}
        variant="outline"
        size="lg"
        className="w-full mt-4"
      >
        <Text className="text-center text-base font-semibold text-gray-900">
          Đăng ký ngay
        </Text>
      </Button>
    </View>
  );
}
