import { useLocalSearchParams } from "expo-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import ResetPasswordForm from "./components/ResetPasswordForm";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || "";

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mã OTP và mật khẩu mới"
      phone={phone}
      iconName="moped"
      showBackButton={true}
    >
      <ResetPasswordForm phone={phone} />
    </AuthLayout>
  );
}
