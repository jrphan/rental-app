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

export default function ProfileScreen() {
  const toast = useToast();
  const { logout, user, isAuthenticated, token } = useAuthStore();

  console.log("user", JSON.stringify(user, null, 2), isAuthenticated, token);

  const handleLogout = () => {
    logout();
    toast.showSuccess("Đã đăng xuất thành công", { title: "Đăng xuất" });
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
          contentContainerStyle={{ paddingTop: 20 }}
        >
          <ProfileHeader profile={undefined} user={user} />
          <ProfileInfoCard profile={undefined} user={user} />
          <ProfileActions user={user} myKyc={null} isLoadingKyc={false} />
          <ProfileBio profile={null} />
          <ProfileAddress profile={null} />
          <ProfileLogoutButton onLogout={handleLogout} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
