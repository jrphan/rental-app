import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ChangePasswordForm from "./components/ChangePasswordForm";

export default function ChangePasswordScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mb-6 pt-4">
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#000"
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          />
          <Text className="text-2xl font-bold text-gray-900">Đổi mật khẩu</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <ChangePasswordForm />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
