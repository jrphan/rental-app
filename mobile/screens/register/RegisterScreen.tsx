import { useRouter } from "expo-router";
import ROUTES from "@/constants/routes";
import { AuthLayout } from "@/components/auth/auth-layout";
import RegisterHeader from "./components/RegisterHeader";
import RegisterPrompt from "./components/RegisterPrompt";
import RegisterForm from "./components/RegisterForm";

export default function RegisterScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    router.push(ROUTES.PROFILE);
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Đăng ký để bắt đầu trải nghiệm dịch vụ cho thuê xe máy"
      iconName="moped"
      showBackButton
      onBackPress={handleBackPress}
      footer={<RegisterPrompt />}
    >
      <RegisterHeader />
      <RegisterForm />
    </AuthLayout>
  );
}
