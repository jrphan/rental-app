import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView
      className="flex-1 bg-white px-6"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">Trang chủ</Text>
        <Text className="mt-2 text-base text-gray-600 text-center">
          Đây là trang demo sau đăng nhập. App rental motobike sẽ hiển thị nội
          dung thật tại đây.
        </Text>
      </View>
    </SafeAreaView>
  );
}
