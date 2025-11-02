import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-white items-center justify-center px-6"
      edges={["top", "left", "right"]}
    >
      <Text className="text-2xl font-bold text-gray-900">Tin nhắn</Text>
      <Text className="mt-2 text-base text-gray-600 text-center">
        Trang tin nhắn - Danh sách các cuộc trò chuyện với chủ xe và người thuê.
      </Text>
    </SafeAreaView>
  );
}
