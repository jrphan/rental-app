import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/useToast";
import ProfileAuthPrompt from "./components/ProfileAuthPrompt";
import ProfileHeader from "./components/ProfileHeader";
import ProfileInfoCard from "./components/ProfileInfoCard";
import ProfileActions from "./components/ProfileActions";
import ProfileBio from "./components/ProfileBio";
import ProfileAddress from "./components/ProfileAddress";
import ProfileLogoutButton from "./components/ProfileLogoutButton";
import { StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/api.auth";
import { router } from "expo-router";
import ROUTES from "@/constants/routes";

export default function ProfileScreen() {
  const toast = useToast();
  const { logout, user, isAuthenticated } = useAuthStore();

  console.log("user", JSON.stringify(user, null, 2));

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      toast.showSuccess("Đã đăng xuất thành công", { title: "Đăng xuất" });
      router.replace(ROUTES.LOGIN);
    },
    onError: (error: any) => {
      // Vẫn logout ngay cả khi API fail để đảm bảo user có thể logout
      logout();
      toast.showError(
        error?.message || "Đã đăng xuất (có thể không đồng bộ với server)",
        { title: "Đăng xuất" }
      );
      router.replace(ROUTES.LOGIN);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <SafeAreaView
          className="flex-1 bg-white px-6"
          edges={["top", "left", "right"]}
        >
          <ProfileAuthPrompt />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-6"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}
        >
          <ProfileHeader user={user} />
          <ProfileInfoCard user={user} />
          <ProfileActions user={user} isLoadingKyc={false} />
          <ProfileBio profile={null} />
          <ProfileAddress profile={null} />
          <ProfileLogoutButton
            onLogout={handleLogout}
            isLoading={logoutMutation.isPending}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
