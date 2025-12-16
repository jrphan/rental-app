import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import EditProfileForm from "./components/EditProfileForm";
import HeaderBase from "@/components/header/HeaderBase";

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase
        title="Chỉnh sửa hồ sơ"
        showBackButton
        onBackPress={() => router.back()}
      />
      <View className="flex-1 px-6">
        <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
          <EditProfileForm user={user} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
