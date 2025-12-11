import { Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import VerifyPhoneHeader from "./components/VerifyPhoneHeader";
import VerifyPhoneForm from "./components/VerifyPhoneForm";

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const user = useAuthStore((state) => state.user);

  const phone = params.phone || user?.phone || "";

  if (!phone) {
    return (
      <AuthLayout
        iconName="phone"
        title="Lỗi"
        subtitle="Không tìm thấy số điện thoại"
        showBackButton={true}
      >
        <View className="items-center gap-4">
          <Text className="text-center text-gray-600">
            Vui lòng thêm số điện thoại trong phần cài đặt tài khoản
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/edit-profile")}
            className="rounded-2xl bg-primary-600 px-6 py-3"
          >
            <Text className="font-bold text-white">Đi đến cài đặt</Text>
          </TouchableOpacity>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Xác minh Số điện thoại"
      subtitle={"Chúng tôi đã gửi mã OTP đến số:"}
      phone={phone}
      iconName="phone"
      showBackButton={true}
    >
      <VerifyPhoneHeader />
      <VerifyPhoneForm phone={phone} />
    </AuthLayout>
  );
}
