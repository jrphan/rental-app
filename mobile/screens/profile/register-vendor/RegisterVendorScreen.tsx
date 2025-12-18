import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBase from "@/components/header/HeaderBase";
import VehicleForm from "./components/VehicleForm";
import { useLocalSearchParams } from "expo-router";

export default function RegisterVendorScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Đăng ký làm chủ xe" showBackButton />
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
