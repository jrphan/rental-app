import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBase from "@/components/header/HeaderBase";
import KycForm from "./components/KycForm";

export default function KycScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Xác thực danh tính (KYC)" showBackButton />
      <View className="flex-1 px-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <KycForm />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


