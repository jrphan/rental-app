import { useRouter } from "expo-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import LoginForm from "./components/LoginForm";
import LoginHeader from "./components/LoginHeader";
import RegisterPrompt from "./components/RegisterPrompt";
import ROUTES from "@/constants/routes";

export default function LoginScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    router.push(ROUTES.PROFILE);
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để tiếp tục trải nghiệm dịch vụ cho thuê xe máy"
      iconName="moped"
      showBackButton={true}
      onBackPress={handleBackPress}
      footer={<RegisterPrompt />}
    >
      <LoginHeader />
      <LoginForm />
    </AuthLayout>
  );
}
