import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/useToast";
import { profileApi } from "@/services/api.profile";
import { queryKeys } from "@/lib/queryClient";
import ProfileAuthPrompt from "./components/ProfileAuthPrompt";
import ProfileLoading from "./components/ProfileLoading";
import ProfileHeader from "./components/ProfileHeader";
import ProfileInfoCard from "./components/ProfileInfoCard";
import ProfileActions from "./components/ProfileActions";
import ProfileBio from "./components/ProfileBio";
import ProfileAddress from "./components/ProfileAddress";
import ProfileLogoutButton from "./components/ProfileLogoutButton";
import { StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ProfileScreen() {
  const { logout, user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    toast.showSuccess("Đã đăng xuất thành công", { title: "Đăng xuất" });
  };

  // Fetch profile data if authenticated
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: queryKeys.profile.detail(user?.id),
    queryFn: () => profileApi.getProfile(),
    enabled: !!user?.id && isAuthenticated,
  });

  const queryClient = useQueryClient();

  // const { data: myOwnerApplication, isLoading: isLoadingOwnerApp } = useQuery({
  //   queryKey: ["owner-application", user?.id],
  //   queryFn: () => profileApi.getMyOwnerApplication(),
  //   enabled: !!user?.id && isAuthenticated,
  // });

  const { data: myKyc, isLoading: isLoadingKyc } = useQuery({
    queryKey: ["kyc", user?.id],
    queryFn: () => profileApi.getMyKYC(),
    enabled: !!user?.id && isAuthenticated,
  });

  // Check if any critical data is still loading
  const isLoading = isLoadingProfile;

  const submitOwnerApplicationMutation = useMutation({
    mutationFn: (notes?: string) => profileApi.submitOwnerApplication(notes),
    onSuccess: () => {
      toast.showSuccess("Đã gửi yêu cầu làm chủ xe", { title: "Thành công" });
      queryClient.invalidateQueries({
        queryKey: ["owner-application", user?.id],
      });
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Gửi yêu cầu thất bại", { title: "Lỗi" });
    },
  });

  const profile = profileData?.profile;

  // Not authenticated - show login/register options
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

  // Authenticated - show profile
  // Show loading skeleton while profile data is loading
  if (isLoading) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <SafeAreaView
          className="flex-1 bg-white"
          edges={["top", "left", "right"]}
        >
          <ProfileLoading />
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
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <ScrollView showsVerticalScrollIndicator={false} className="px-6">
          <ProfileHeader profile={profile ?? undefined} user={user} />
          <ProfileInfoCard profile={profile ?? undefined} user={user} />
          <ProfileActions
            user={user}
            myKyc={myKyc ?? null}
            isLoadingKyc={isLoadingKyc}
            router={router}
            submitOwnerApplicationMutation={submitOwnerApplicationMutation}
          />
          <ProfileBio profile={profile ?? null} />
          <ProfileAddress profile={profile ?? null} />
          <ProfileLogoutButton onLogout={handleLogout} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
