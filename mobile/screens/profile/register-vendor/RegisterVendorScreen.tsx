import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBase from "@/components/header/HeaderBase";
import VehicleForm from "./components/VehicleForm";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function RegisterVendorScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const router = useRouter();
  const isEditMode = !!vehicleId;

  const handleBackPress = () => {
    if (isEditMode) {
      // Nếu đang edit, quay về danh sách xe
      router.push("/(tabs)/vehicles");
    } else {
      // Nếu đang tạo mới, quay về màn hình trước
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase
        title={isEditMode ? "Chỉnh sửa thông tin xe" : "Đăng ký làm chủ xe"}
        showBackButton
        onBackPress={handleBackPress}
      />
      <View className="flex-1 px-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <VehicleForm vehicleId={vehicleId} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
