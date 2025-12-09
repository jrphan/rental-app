import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";

export default function RegisterPrompt() {
  const router = useRouter();

  const handleLoginPress = () => {
    router.push(ROUTES.LOGIN);
  };

  return (
    <View className="items-center">
      <View className="flex-row items-center">
        <Text className="text-base text-gray-600">Đã có tài khoản? </Text>
        <TouchableOpacity onPress={handleLoginPress}>
          <Text className="font-bold text-primary-600">Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
