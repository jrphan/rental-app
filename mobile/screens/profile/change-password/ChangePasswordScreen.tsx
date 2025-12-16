import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChangePasswordForm from "./components/ChangePasswordForm";
import HeaderBase from "@/components/header/HeaderBase";

export default function ChangePasswordScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Đổi mật khẩu" showBackButton />
      <View className="flex-1 p-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          <ChangePasswordForm />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
