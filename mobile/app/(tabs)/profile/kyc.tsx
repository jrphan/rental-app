import React from "react";
import { View, ScrollView, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { ImageInput } from "@/components/ui/image-input";
import { Button } from "@/components/ui/button";
import { useKycSubmissionForm } from "@/forms/profile.forms";
import { profileApi } from "@/lib/api.profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthStore } from "@/store/auth";

export default function KycScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const form = useKycSubmissionForm();

  // Fetch existing KYC
  const { data: existingKyc, isLoading: isLoadingKyc } = useQuery({
    queryKey: ["kyc", user?.id],
    queryFn: () => profileApi.getMyKYC(),
    enabled: !!user?.id,
  });

  // Update form with existing KYC data
  React.useEffect(() => {
    if (existingKyc && existingKyc.status !== "APPROVED") {
      form.reset({
        idNumber: existingKyc.idNumber || "",
        idCardFrontUrl: existingKyc.idCardFrontUrl || "",
        idCardBackUrl: existingKyc.idCardBackUrl || "",
        driverLicenseUrl: existingKyc.driverLicenseUrl || "",
        selfieUrl: existingKyc.selfieUrl || "",
        notes: existingKyc.notes || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingKyc]);

  const mutation = useMutation({
    mutationFn: profileApi.submitKYC,
    onSuccess: (data) => {
      toast.showSuccess(data.message, {
        title: "Gửi KYC thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["kyc", user?.id] });
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Gửi KYC thất bại";
      toast.showError(errorMessage, { title: "Lỗi" });
    },
  });

  const onSubmit = (data: typeof form.formState.defaultValues) => {
    // Clean up empty strings
    const cleanedData: any = {};
    Object.entries(data || ({} as any)).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        cleanedData[key] = value;
      }
    });

    if (Object.keys(cleanedData).length === 0) {
      toast.showError("Vui lòng nhập ít nhất một thông tin", { title: "Lỗi" });
      return;
    }

    mutation.mutate(cleanedData);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center mb-6 pt-4">
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#000"
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          />
          <Text className="text-2xl font-bold text-gray-900">
            Xác thực danh tính (KYC)
          </Text>
        </View>

        {isLoadingKyc ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#EA580C" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* KYC Status Card */}
            {existingKyc && (
              <View className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-semibold text-gray-900">
                    Trạng thái KYC
                  </Text>
                  <View className="flex-row items-center">
                    <View
                      className={`w-2 h-2 rounded-full mr-2 ${
                        existingKyc.status === "APPROVED"
                          ? "bg-green-500"
                          : existingKyc.status === "REJECTED"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <Text className="text-sm font-semibold text-gray-900">
                      {existingKyc.status === "APPROVED"
                        ? "Đã được duyệt"
                        : existingKyc.status === "REJECTED"
                        ? "Bị từ chối"
                        : "Đang chờ duyệt"}
                    </Text>
                  </View>
                </View>
                {existingKyc.reviewNotes && (
                  <View className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <Text className="text-sm font-semibold text-gray-900 mb-1">
                      Ghi chú từ admin:
                    </Text>
                    <Text className="text-sm text-gray-700">
                      {existingKyc.reviewNotes}
                    </Text>
                  </View>
                )}
                {existingKyc.reviewedAt && (
                  <Text className="text-xs text-gray-500 mt-2">
                    Đã xem xét:{" "}
                    {new Date(existingKyc.reviewedAt).toLocaleDateString(
                      "vi-VN"
                    )}
                  </Text>
                )}
                {existingKyc.status === "APPROVED" && (
                  <Text className="text-sm text-green-600 mt-2">
                    KYC của bạn đã được duyệt. Không thể chỉnh sửa.
                  </Text>
                )}
              </View>
            )}

            <View className="mb-4">
              <Text className="text-base text-gray-600 mb-6">
                {existingKyc?.status === "APPROVED"
                  ? "KYC của bạn đã được duyệt. Thông tin dưới đây chỉ để tham khảo."
                  : "Vui lòng cung cấp các tài liệu sau để xác thực danh tính của bạn. Thông tin của bạn sẽ được bảo mật tuyệt đối."}
              </Text>

              <Controller
                control={form.control}
                name="idNumber"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <Input
                    label="Số CMND/CCCD"
                    placeholder="Nhập số CMND/CCCD"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    keyboardType="number-pad"
                    editable={!mutation.isPending}
                  />
                )}
              />

              <View className="mt-4">
                <Controller
                  control={form.control}
                  name="idCardFrontUrl"
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <ImageInput
                      label="Mặt trước CMND/CCCD"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      folder="kyc"
                      multiple={false}
                      editable={!mutation.isPending}
                    />
                  )}
                />
              </View>

              <View className="mt-4">
                <Controller
                  control={form.control}
                  name="idCardBackUrl"
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <ImageInput
                      label="Mặt sau CMND/CCCD"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      folder="kyc"
                      multiple={false}
                      editable={!mutation.isPending}
                    />
                  )}
                />
              </View>

              <View className="mt-4">
                <Controller
                  control={form.control}
                  name="selfieUrl"
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <ImageInput
                      label="Ảnh selfie với CMND/CCCD"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      folder="kyc"
                      multiple={false}
                      editable={!mutation.isPending}
                    />
                  )}
                />
              </View>

              <View className="mt-4">
                <Controller
                  control={form.control}
                  name="driverLicenseUrl"
                  render={({
                    field: { value, onChange },
                    fieldState: { error },
                  }) => (
                    <ImageInput
                      label="Ảnh bằng lái xe"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                      folder="kyc"
                      multiple={true}
                      editable={!mutation.isPending}
                    />
                  )}
                />
              </View>

              <View className="mt-4">
                <Controller
                  control={form.control}
                  name="notes"
                  render={({
                    field: { onChange, onBlur, value },
                    fieldState: { error },
                  }) => (
                    <Input
                      label="Ghi chú"
                      placeholder="Ghi chú bổ sung (nếu có)"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      editable={!mutation.isPending}
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
              </View>
            </View>

            <Button
              onPress={form.handleSubmit(onSubmit)}
              disabled={
                mutation.isPending || existingKyc?.status === "APPROVED"
              }
              className="mb-24"
              size="lg"
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : existingKyc?.status === "APPROVED" ? (
                "KYC đã được duyệt"
              ) : existingKyc ? (
                "Cập nhật thông tin KYC"
              ) : (
                "Gửi thông tin KYC"
              )}
            </Button>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
