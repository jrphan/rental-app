import { useState } from "react";
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useKycSubmissionForm } from "@/forms/profile.forms";
import { profileApi } from "@/lib/api.profile";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/lib/toast";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function KycScreen() {
  const router = useRouter();
  const toast = useToast();
  const form = useKycSubmissionForm();

  const mutation = useMutation({
    mutationFn: profileApi.submitKYC,
    onSuccess: (data) => {
      toast.showSuccess(data.message, {
        title: "Gửi KYC thành công",
      });
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
    Object.entries(data).forEach(([key, value]) => {
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

  const handleUploadDocument = (fieldName: string) => {
    // TODO: Implement image picker and upload
    Alert.alert(
      "Tải lên tài liệu",
      "Tính năng tải lên hình ảnh sẽ được triển khai trong phiên bản tiếp theo. Vui lòng nhập URL hình ảnh tạm thời.",
      [
        { text: "OK", style: "default" },
      ]
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
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

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            <Text className="text-base text-gray-600 mb-6">
              Vui lòng cung cấp các tài liệu sau để xác thực danh tính của bạn.
              Thông tin của bạn sẽ được bảo mật tuyệt đối.
            </Text>

            <Controller
              control={form.control}
              name="idNumber"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                Hình ảnh CMND/CCCD
              </Text>
              <Controller
                control={form.control}
                name="idCardFrontUrl"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <Input
                      label="Mặt trước CMND/CCCD (URL)"
                      placeholder="Nhập URL hình ảnh hoặc tải lên"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      editable={!mutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => handleUploadDocument("idCardFrontUrl")}
                      className="mt-2"
                    >
                      <Text className="text-primary-600 font-medium">
                        + Tải lên hình ảnh
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <View className="mt-4">
              <Controller
                control={form.control}
                name="idCardBackUrl"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <Input
                      label="Mặt sau CMND/CCCD (URL)"
                      placeholder="Nhập URL hình ảnh hoặc tải lên"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      editable={!mutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => handleUploadDocument("idCardBackUrl")}
                      className="mt-2"
                    >
                      <Text className="text-primary-600 font-medium">
                        + Tải lên hình ảnh
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <View className="mt-4">
              <Controller
                control={form.control}
                name="selfieUrl"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <Input
                      label="Ảnh selfie với CMND/CCCD (URL)"
                      placeholder="Nhập URL hình ảnh hoặc tải lên"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      editable={!mutation.isPending}
                    />
                    <TouchableOpacity
                      onPress={() => handleUploadDocument("selfieUrl")}
                      className="mt-2"
                    >
                      <Text className="text-primary-600 font-medium">
                        + Tải lên hình ảnh
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                Tài liệu bổ sung (Tùy chọn)
              </Text>
              <Controller
                control={form.control}
                name="passportUrl"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    label="Passport (URL)"
                    placeholder="Nhập URL hình ảnh"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    editable={!mutation.isPending}
                  />
                )}
              />
            </View>

            <View className="mt-4">
              <Controller
                control={form.control}
                name="driverLicenseUrl"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    label="Bằng lái xe (URL)"
                    placeholder="Nhập URL hình ảnh"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    editable={!mutation.isPending}
                  />
                )}
              />
            </View>

            <View className="mt-4">
              <Controller
                control={form.control}
                name="notes"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
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
            disabled={mutation.isPending}
            className="mb-24 mt-4"
            size="lg"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Gửi thông tin KYC"
            )}
          </Button>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

