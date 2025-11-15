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
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { useToast } from "@/lib/toast";
import { useRequirePhoneVerification } from "@/lib/auth";
import { GalleryButton } from "@/components/gallery/gallery-button";
import { Select } from "@/components/ui/select";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

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
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2020");
  const [color, setColor] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [dailyRate, setDailyRate] = useState("200000");
  const [depositAmount, setDepositAmount] = useState("1000000");
  const [fuelType, setFuelType] = useState<"PETROL" | "ELECTRIC" | "HYBRID">(
    "PETROL"
  );
  const [transmission, setTransmission] = useState<
    "MANUAL" | "AUTOMATIC" | "SEMI_AUTOMATIC"
  >("MANUAL");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<Map<string, string>>(
    new Map()
  ); // Map URL -> Image ID
  const queryClient = useQueryClient();

  // Load vehicle data if editing
  const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => vehiclesApi.getById(vehicleId!),
    enabled: isEditMode && !!vehicleId,
  });

  // Pre-fill form when vehicle data is loaded
  useEffect(() => {
    if (vehicleData) {
      setBrand(vehicleData.brand || "");
      setModel(vehicleData.model || "");
      setYear(String(vehicleData.year || "2020"));
      setColor(vehicleData.color || "");
      setLicensePlate(vehicleData.licensePlate || "");
      setDailyRate(String(vehicleData.dailyRate || "200000"));
      setDepositAmount(String(vehicleData.depositAmount || "1000000"));

      // Set fuelType and transmission if available
      if (vehicleData.fuelType) {
        setFuelType(vehicleData.fuelType as typeof fuelType);
      }
      if (vehicleData.transmission) {
        setTransmission(vehicleData.transmission as typeof transmission);
      }

      // Load existing images
      if (vehicleData.images && vehicleData.images.length > 0) {
        const urls = vehicleData.images.map((img) => img.url);
        setImageUrls(urls);
        // Map URLs to image IDs for deletion
        const urlToIdMap = new Map<string, string>();
        vehicleData.images.forEach((img) => {
          urlToIdMap.set(img.url, img.id);
        });
        setExistingImageIds(urlToIdMap);
      }
    }
  }, [vehicleData]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode && vehicleId) {
        // Update existing vehicle
        const vehicle = await vehiclesApi.update(vehicleId, {
          brand,
          model,
          year: Number(year),
          color,
          licensePlate,
          dailyRate: Number(dailyRate),
          depositAmount: Number(depositAmount),
          fuelType,
          transmission,
        });

        // Handle images: add new ones and remove deleted ones
        const currentUrls = new Set(imageUrls);
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
        const urlsToAdd = imageUrls.filter((url) => !existingUrls.has(url));
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
          brand,
          model,
          year: Number(year),
          color,
          licensePlate,
          dailyRate: Number(dailyRate),
          depositAmount: Number(depositAmount),
          fuelType,
          transmission,
        });

        // Thêm hình ảnh nếu có
        if (imageUrls.length > 0) {
          try {
            await Promise.all(
              imageUrls.map((url) => vehiclesApi.addImage(vehicle.id, url))
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
    setImageUrls(urls);
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert("Xóa hình ảnh", "Bạn có chắc muốn xóa hình ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setImageUrls((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  // Check phone verification after all hooks
  if (!requirePhoneVerification()) {
    return null; // Đã redirect
  }

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
          <TextInput
            placeholder="Hãng *"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            placeholder="Dòng xe *"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={model}
            onChangeText={setModel}
          />
          <TextInput
            placeholder="Năm *"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={year}
            onChangeText={setYear}
          />
          <TextInput
            placeholder="Màu *"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={color}
            onChangeText={setColor}
          />
          <TextInput
            placeholder="Biển số *"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={licensePlate}
            onChangeText={setLicensePlate}
          />

          {/* Nhiên liệu */}
          <Select
            label="Nhiên liệu"
            placeholder="Chọn loại nhiên liệu"
            value={fuelType}
            onValueChange={(value) => setFuelType(value as typeof fuelType)}
            options={[
              { label: "Xăng", value: "PETROL" },
              { label: "Điện", value: "ELECTRIC" },
              { label: "Hybrid", value: "HYBRID" },
            ]}
          />

          {/* Hộp số */}
          <Select
            label="Hộp số"
            placeholder="Chọn loại hộp số"
            value={transmission}
            onValueChange={(value) =>
              setTransmission(value as typeof transmission)
            }
            options={[
              { label: "Số sàn", value: "MANUAL" },
              { label: "Số tự động", value: "AUTOMATIC" },
              { label: "Bán tự động", value: "SEMI_AUTOMATIC" },
            ]}
          />

          <TextInput
            placeholder="Giá ngày (đ) *"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={dailyRate}
            onChangeText={setDailyRate}
          />
          <TextInput
            placeholder="Tiền cọc (đ) *"
            keyboardType="numeric"
            className="border border-gray-300 rounded-lg px-4 py-3"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />
        </View>

        {/* Hình ảnh xe */}
        <View className="mt-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Hình ảnh xe {imageUrls.length > 0 && `(${imageUrls.length})`}
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
          {imageUrls.length > 0 && (
            <View className="mt-4">
              <View className="flex-row flex-wrap gap-3">
                {imageUrls.map((url, index) => (
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
        </View>

        <TouchableOpacity
          className="mt-6 bg-orange-600 rounded-lg px-4 py-3 items-center"
          onPress={() => createMutation.mutate()}
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
