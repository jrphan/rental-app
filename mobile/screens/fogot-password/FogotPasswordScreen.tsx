import { AuthLayout } from "@/components/auth/auth-layout";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import ForgotPasswordHeader from "./components/ForgotPasswordHeader";

export default function ForgotPasswordScreen() {
  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập số điện thoại của bạn để nhận mã OTP đặt lại mật khẩu"
      iconName="moped"
      showBackButton={true}
    >
      <ForgotPasswordHeader />
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
