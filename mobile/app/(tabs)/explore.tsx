import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 items-center justify-center px-6">
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        Khám phá (demo)
      </Text>
      <Text className="mt-2 text-base text-gray-600 dark:text-gray-400 text-center">
        Trang demo nội dung khám phá. Sẽ hiển thị danh sách xe máy cho thuê.
      </Text>
    </SafeAreaView>
  );
}
