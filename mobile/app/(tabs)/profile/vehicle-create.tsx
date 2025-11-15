import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { useToast } from "@/lib/toast";
import { useRequirePhoneVerification } from "@/lib/auth";
import { GalleryButton } from "@/components/gallery/gallery-button";
import { Select } from "@/components/ui/select";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useVehicleForm } from "@/forms/vehicle.forms";
import { VehicleInput } from "@/schemas/vehicle.schema";

export default function VehicleCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  const vehicleId = params.vehicleId;
  const isEditMode = !!vehicleId;
  const toast = useToast();
  const { requirePhoneVerification } = useRequirePhoneVerification({
    message: "Vui lòng xác minh số điện thoại để đăng xe cho thuê",
  });

  // All hooks must be called before any early returns
  const [existingImageIds, setExistingImageIds] = useState<Map<string, string>>(
    new Map()
  ); // Map URL -> Image ID
  const queryClient = useQueryClient();

  // Initialize form
  const form = useVehicleForm();

  // Load vehicle data if editing
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => vehiclesApi.getById(vehicleId!),
    enabled: isEditMode && !!vehicleId,
  });

  // Pre-fill form when vehicle data is loaded
  useEffect(() => {
    if (vehicleData) {
      const imageUrls =
        vehicleData.images && vehicleData.images.length > 0
          ? vehicleData.images.map((img) => img.url)
          : [];

      // Map URLs to image IDs for deletion
      const urlToIdMap = new Map<string, string>();
      if (vehicleData.images) {
        vehicleData.images.forEach((img) => {
          urlToIdMap.set(img.url, img.id);
        });
      }
      setExistingImageIds(urlToIdMap);

      form.reset({
        brand: vehicleData.brand || "",
        model: vehicleData.model || "",
        year: String(vehicleData.year || "2020"),
        color: vehicleData.color || "",
        licensePlate: vehicleData.licensePlate || "",
        dailyRate: String(vehicleData.dailyRate || "200000"),
        depositAmount: String(vehicleData.depositAmount || "1000000"),
        fuelType:
          (vehicleData.fuelType as VehicleInput["fuelType"]) || "PETROL",
        transmission:
          (vehicleData.transmission as VehicleInput["transmission"]) ||
          "MANUAL",
        imageUrls,
      });
    }
  }, [vehicleData, form]);

  const createMutation = useMutation({
    mutationFn: async (data: VehicleInput) => {
      if (isEditMode && vehicleId) {
        // Update existing vehicle
        const vehicle = await vehiclesApi.update(vehicleId, {
          brand: data.brand,
          model: data.model,
          year: Number(data.year),
          color: data.color,
          licensePlate: data.licensePlate,
          dailyRate: Number(data.dailyRate),
          depositAmount: Number(data.depositAmount),
          fuelType: data.fuelType,
          transmission: data.transmission,
        });

        // Handle images: add new ones and remove deleted ones
        const currentUrls = new Set(data.imageUrls);
        const existingUrls = new Set(Array.from(existingImageIds.keys()));

        // Remove images that are no longer in the list
        const urlsToRemove = Array.from(existingUrls).filter(
          (url) => !currentUrls.has(url)
        );
        for (const url of urlsToRemove) {
          const imageId = existingImageIds.get(url);
          if (imageId) {
            try {
              await vehiclesApi.removeImage(vehicleId, imageId);
            } catch (error) {
              console.error("Error removing image:", error);
            }
          }
        }

        // Add new images
        const urlsToAdd = data.imageUrls.filter(
          (url) => !existingUrls.has(url)
        );
        if (urlsToAdd.length > 0) {
          try {
            await Promise.all(
              urlsToAdd.map((url) => vehiclesApi.addImage(vehicleId, url))
            );
          } catch (imageError: any) {
            console.error("Error adding images:", imageError);
            toast.showError(
              imageError?.message || "Cập nhật xe nhưng thêm hình ảnh thất bại",
              { title: "Cảnh báo" }
            );
          }
        }

        return vehicle;
      } else {
        // Create new vehicle
        const vehicle = await vehiclesApi.create({
          brand: data.brand,
          model: data.model,
          year: Number(data.year),
          color: data.color,
          licensePlate: data.licensePlate,
          dailyRate: Number(data.dailyRate),
          depositAmount: Number(data.depositAmount),
          fuelType: data.fuelType,
          transmission: data.transmission,
        });

        // Thêm hình ảnh nếu có
        if (data.imageUrls.length > 0) {
          try {
            await Promise.all(
              data.imageUrls.map((url) => vehiclesApi.addImage(vehicle.id, url))
            );
          } catch (imageError: any) {
            console.error("Error adding images:", imageError);
            toast.showError(
              imageError?.message || "Đã tạo xe nhưng thêm hình ảnh thất bại",
              { title: "Cảnh báo" }
            );
          }
        }

        return vehicle;
      }
    },
    onSuccess: () => {
      toast.showSuccess(isEditMode ? "Đã cập nhật xe" : "Đã tạo xe (DRAFT)", {
        title: "Thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      }
      router.back();
    },
    onError: (e: any) => {
      // Parse error message from API response
      const errorMessage =
        e?.response?.data?.message ||
        e?.message ||
        (isEditMode ? "Cập nhật xe thất bại" : "Tạo xe thất bại");

      // Check for duplicate license plate error
      if (
        errorMessage.includes("biển số") ||
        errorMessage.includes("licensePlate")
      ) {
        toast.showError(errorMessage, { title: "Biển số đã tồn tại" });
      } else {
        toast.showError(errorMessage, { title: "Lỗi" });
      }
    },
  });

  const handleSelectImages = async (urls: string[]) => {
    form.setValue("imageUrls", urls, { shouldValidate: true });
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert("Xóa hình ảnh", "Bạn có chắc muốn xóa hình ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          const currentImages = form.getValues("imageUrls");
          form.setValue(
            "imageUrls",
            currentImages.filter((_, i) => i !== index),
            { shouldValidate: true }
          );
        },
      },
    ]);
  };

  const onSubmit = (data: VehicleInput) => {
    createMutation.mutate(data);
  };

  // Check phone verification after all hooks
  // if (!requirePhoneVerification()) {
  //   return null; // Đã redirect
  // }

  if (isLoadingVehicle) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Đang tải thông tin xe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center mb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-base text-gray-900">
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Chỉnh sửa xe" : "Đăng xe mới"}
          </Text>
        </View>
        <View className="gap-4">
          {/* Brand */}
          <Controller
            control={form.control}
            name="brand"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Hãng *
                </Text>
                <TextInput
                  placeholder="Hãng *"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Model */}
          <Controller
            control={form.control}
            name="model"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Dòng xe *
                </Text>
                <TextInput
                  placeholder="Dòng xe *"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Year */}
          <Controller
            control={form.control}
            name="year"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Năm *
                </Text>
                <TextInput
                  placeholder="Năm *"
                  keyboardType="numeric"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Color */}
          <Controller
            control={form.control}
            name="color"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Màu *
                </Text>
                <TextInput
                  placeholder="Màu *"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* License Plate */}
          <Controller
            control={form.control}
            name="licensePlate"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Biển số *
                </Text>
                <TextInput
                  placeholder="Biển số *"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Fuel Type */}
          <Controller
            control={form.control}
            name="fuelType"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View>
                <Select
                  label="Nhiên liệu"
                  placeholder="Chọn loại nhiên liệu"
                  value={value}
                  onValueChange={onChange}
                  options={[
                    { label: "Xăng", value: "PETROL" },
                    { label: "Điện", value: "ELECTRIC" },
                    { label: "Hybrid", value: "HYBRID" },
                  ]}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Transmission */}
          <Controller
            control={form.control}
            name="transmission"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View>
                <Select
                  label="Hộp số"
                  placeholder="Chọn loại hộp số"
                  value={value}
                  onValueChange={onChange}
                  options={[
                    { label: "Số sàn", value: "MANUAL" },
                    { label: "Số tự động", value: "AUTOMATIC" },
                    { label: "Bán tự động", value: "SEMI_AUTOMATIC" },
                  ]}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Daily Rate */}
          <Controller
            control={form.control}
            name="dailyRate"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Giá ngày (đ) *
                </Text>
                <TextInput
                  placeholder="Giá ngày (đ) *"
                  keyboardType="numeric"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Deposit Amount */}
          <Controller
            control={form.control}
            name="depositAmount"
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Tiền cọc (đ) *
                </Text>
                <TextInput
                  placeholder="Tiền cọc (đ) *"
                  keyboardType="numeric"
                  className={`border rounded-lg px-4 py-3 ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                {error && (
                  <Text className="text-red-500 text-xs mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />
        </View>

        {/* Hình ảnh xe */}
        <Controller
          control={form.control}
          name="imageUrls"
          render={({ field: { value }, fieldState: { error } }) => (
            <View className="mt-4">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Hình ảnh xe {value.length > 0 && `(${value.length})`}
              </Text>
              <Text className="text-sm text-gray-600 mb-3">
                * Bắt buộc có ít nhất 1 hình ảnh để gửi duyệt
              </Text>

              {/* Gallery Button */}
              <GalleryButton
                onSelect={handleSelectImages}
                folder="vehicles"
                multiple={true}
                maxSelections={10}
                label="Chọn hình ảnh từ thư viện"
                variant="outline"
              />

              {/* Hiển thị hình ảnh đã chọn */}
              {value.length > 0 && (
                <View className="mt-4">
                  <View className="flex-row flex-wrap gap-3">
                    {value.map((url, index) => (
                      <View key={index} className="relative">
                        <Image
                          source={{ uri: url }}
                          className="w-24 h-24 rounded-lg"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        >
                          <MaterialIcons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {error && (
                <Text className="text-red-500 text-xs mt-1">
                  {error.message}
                </Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity
          className="mt-6 bg-orange-600 rounded-lg px-4 py-3 items-center disabled:opacity-50"
          onPress={form.handleSubmit(onSubmit)}
          disabled={createMutation.isPending}
        >
          <Text className="text-white font-semibold">
            {createMutation.isPending
              ? isEditMode
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEditMode
              ? "Cập nhật xe"
              : "Tạo xe"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
