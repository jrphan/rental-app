import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBase from "@/components/header/HeaderBase";
import VehicleForm from "@/screens/profile/register-vendor/components/VehicleForm";

export default function CreateVehicleScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Thêm xe mới" showBackButton />
      <View className="flex-1 px-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <VehicleForm />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
