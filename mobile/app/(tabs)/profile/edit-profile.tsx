import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ProfileFieldEditor } from "@/components/profile/profile-field-editor";
import { useUpdateProfileForm } from "@/forms/profile.forms";
import { profileApi } from "@/lib/api.profile";
import { useAuthStore } from "@/store/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { queryKeys } from "@/lib/queryClient";

export default function EditProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.profile.detail(user?.id),
    queryFn: () => profileApi.getProfile(),
    enabled: !!user?.id,
  });

  const form = useUpdateProfileForm({
    firstName: profileData?.profile?.firstName || "",
    lastName: profileData?.profile?.lastName || "",
    avatar: profileData?.profile?.avatar || "",
    dateOfBirth: profileData?.profile?.dateOfBirth
      ? new Date(profileData.profile.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: (profileData?.profile?.gender as any) || undefined,
    bio: profileData?.profile?.bio || "",
    address: profileData?.profile?.address || "",
    cityId: profileData?.profile?.cityId || "",
    zipCode: profileData?.profile?.zipCode || "",
    phone: profileData?.phone || user?.phone || "",
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profileData && !isLoading) {
      form.reset({
        firstName: profileData.profile?.firstName || "",
        lastName: profileData.profile?.lastName || "",
        avatar: profileData.profile?.avatar || "",
        dateOfBirth: profileData.profile?.dateOfBirth
          ? new Date(profileData.profile.dateOfBirth)
              .toISOString()
              .split("T")[0]
          : "",
        gender: (profileData.profile?.gender as any) || undefined,
        bio: profileData.profile?.bio || "",
        address: profileData.profile?.address || "",
        cityId: profileData.profile?.cityId || "",
        zipCode: profileData.profile?.zipCode || "",
        phone: profileData.phone || user?.phone || "",
      });
      setIsLoadingProfile(false);
    }
  }, [profileData, isLoading, form, user?.phone]);

  const mutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      // Update user in store (only phone field belongs to User table)
      // Other profile fields (firstName, lastName, avatar, etc.) are stored
      // in UserProfile table and will be refetched via query cache invalidation
      if (data?.phone !== undefined) {
        updateUser({
          phone: data.phone || undefined,
        });
      }
      // Invalidate profile query cache to refresh all profile data
      queryClient.invalidateQueries({
        queryKey: queryKeys.profile.detail(user?.id),
      });
      toast.showSuccess("Cập nhật thông tin thành công!", {
        title: "Thành công",
      });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Cập nhật thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    // Clean up empty strings
    const cleanedData: any = {};
    Object.entries(data || {}).forEach(([key, value]: [string, string]) => {
      if (value !== "" && value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });
    mutation.mutate(cleanedData);
  };

  if (isLoading || isLoadingProfile) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            Chỉnh sửa hồ sơ
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Personal Info */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin cá nhân
            </Text>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="firstName"
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <ProfileFieldEditor
                      label="Họ"
                      placeholder="Nhập họ"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      disabled={mutation.isPending}
                      type="text"
                      containerClassName="mb-0"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={form.control}
                  name="lastName"
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <ProfileFieldEditor
                      label="Tên"
                      placeholder="Nhập tên"
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      disabled={mutation.isPending}
                      type="text"
                      containerClassName="mb-0"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={form.control}
              name="phone"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <ProfileFieldEditor
                  label="Số điện thoại"
                  placeholder="Nhập số điện thoại"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  disabled={mutation.isPending}
                  type="phone"
                  keyboardType="phone-pad"
                />
              )}
            />
          </View>

          {/* Additional Info */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin bổ sung
            </Text>

            <Controller
              control={form.control}
              name="dateOfBirth"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <ProfileFieldEditor
                  label="Ngày sinh"
                  placeholder="Chọn ngày sinh"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  disabled={mutation.isPending}
                  type="date"
                />
              )}
            />

            <Controller
              control={form.control}
              name="address"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <ProfileFieldEditor
                  label="Địa chỉ"
                  placeholder="Nhập địa chỉ"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  disabled={mutation.isPending}
                  type="editor"
                  numberOfLines={3}
                />
              )}
            />
          </View>

          {/* Bio */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Giới thiệu
            </Text>

            <Controller
              control={form.control}
              name="bio"
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <ProfileFieldEditor
                  label="Giới thiệu về bạn"
                  placeholder="Viết một chút về bản thân..."
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  disabled={mutation.isPending}
                  type="editor"
                  numberOfLines={6}
                />
              )}
            />
          </View>

          <Button
            onPress={form.handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="mb-24"
            size="lg"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
