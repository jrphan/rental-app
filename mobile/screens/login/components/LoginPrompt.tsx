import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import ROUTES from "@/constants/routes";

export default function LoginPrompt() {
  const router = useRouter();

  const handleRegisterPress = () => {
    router.push(ROUTES.REGISTER);
  };

  return (
    <View className="items-center">
      <View className="flex-row items-center">
        <Text className="text-base text-gray-600">Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={handleRegisterPress}>
          <Text className="font-bold text-primary-600">Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
