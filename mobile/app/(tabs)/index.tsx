import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900 px-6">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Trang chủ (demo)
        </Text>
        <Text className="mt-2 text-base text-gray-600 dark:text-gray-400 text-center">
          Đây là trang demo sau đăng nhập. App rental motobike sẽ hiển thị nội
          dung thật tại đây.
        </Text>
      </View>
      <Button onPress={handleLogout} className="mb-6">
        <Text className="text-center text-base font-semibold text-white">
          Đăng xuất
        </Text>
      </Button>
    </SafeAreaView>
  );
}
