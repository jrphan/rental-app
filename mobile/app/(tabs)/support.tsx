import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupportScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-white items-center justify-center px-6"
      edges={["top", "left", "right"]}
    >
      <Text className="text-2xl font-bold text-gray-900">Hỗ trợ</Text>
      <Text className="mt-2 text-base text-gray-600 text-center">
        Trang hỗ trợ - Liên hệ với đội ngũ hỗ trợ khách hàng.
      </Text>
    </SafeAreaView>
  );
}
