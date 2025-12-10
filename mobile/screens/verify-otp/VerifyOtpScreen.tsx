import { Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import VerifyOtpHeader from "./components/VerifyOtpHeader";
import VerifyOtpForm from "./components/VerifyOtpForm";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; email?: string }>();

  if (!params.userId) {
    return (
      <AuthLayout
        title="Lỗi"
        subtitle="Không tìm thấy thông tin xác thực"
        iconName="moped"
        showBackButton
      >
        <View className="items-center gap-4">
          <Text className="text-center text-gray-600">
            Vui lòng thử lại hoặc quay lại màn hình trước đó.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-2xl bg-primary-600 px-6 py-3"
          >
            <Text className="font-bold text-white">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Xác thực Email"
      subtitle={"Chúng tôi đã gửi mã OTP đến địa chỉ:"}
      email={params.email}
      iconName="moped"
      showBackButton={true}
    >
      <VerifyOtpHeader />
      <VerifyOtpForm userId={params.userId} email={params.email} />
    </AuthLayout>
  );
}
