import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Modal,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vehiclesApi, rentalsApi } from "@/services/api.vehicles";
import { useToast } from "@/hooks/useToast";
import { useRequirePhoneVerification } from "@/hooks/useAuth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, useRef, useEffect } from "react";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const fullscreenScrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [imageWidth, setImageWidth] = useState(windowWidth);
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);

  const { requirePhoneVerification } = useRequirePhoneVerification({
    message: "Vui lòng xác minh số điện thoại để đặt xe",
  });

  // Scroll to correct image when fullscreen opens
  useEffect(() => {
    if (isFullscreenVisible && fullscreenScrollViewRef.current) {
      setTimeout(() => {
        fullscreenScrollViewRef.current?.scrollTo({
          x: fullscreenIndex * windowWidth,
          animated: false,
        });
      }, 100);
    }
  }, [isFullscreenVisible, fullscreenIndex, windowWidth]);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehiclesApi.getById(id!),
    enabled: !!id,
  });

  const createRentalMutation = useMutation({
    mutationFn: () =>
      rentalsApi.create({
        vehicleId: id!,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    onSuccess: () => {
      toast.showSuccess("Đã gửi yêu cầu đặt xe", { title: "Thành công" });
      router.back();
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Đặt xe thất bại", { title: "Lỗi" });
    },
  });

  const handleRent = () => {
    // if (!requirePhoneVerification()) {
    //   return;
    // }

    Alert.alert("Xác nhận đặt xe", "Bạn có chắc chắn muốn đặt xe này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đặt xe",
        onPress: () => createRentalMutation.mutate(),
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="mt-4 text-gray-600">Đang tải thông tin xe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-lg font-semibold text-gray-900">
            Không tìm thấy xe
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Xe này có thể đã bị xóa hoặc không tồn tại
          </Text>
          <TouchableOpacity
            className="mt-6 bg-orange-600 rounded-lg px-6 py-3"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const images = vehicle.images || [];
  const hasMultipleImages = images.length > 1;
  const dailyRate = Number(vehicle.dailyRate) || 0;
  const depositAmount = Number(vehicle.depositAmount) || 0;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / imageWidth);
    setCurrentIndex(index);
  };

  const handleFullscreenScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / windowWidth);
    setFullscreenIndex(index);
  };

  const handleImageLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setImageWidth(width);
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setIsFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenVisible(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            Chi tiết xe
          </Text>
          <View className="w-10" />
        </View>

        {/* Image Carousel */}
        <View
          className="w-full h-96 bg-gray-100 relative"
          onLayout={handleImageLayout}
        >
          {images.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={imageWidth}
                snapToAlignment="start"
              >
                {images.map((img, index) => (
                  <TouchableOpacity
                    key={img.id}
                    activeOpacity={1}
                    onPress={() => openFullscreen(index)}
                  >
                    <Image
                      source={{ uri: img.url }}
                      className="h-full"
                      style={{ width: imageWidth }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {hasMultipleImages && (
                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center items-center">
                  {images.map((_, index) => (
                    <View
                      key={index}
                      className={`mx-1.5 rounded-full ${
                        index === currentIndex
                          ? "bg-white w-2.5 h-2.5"
                          : "bg-white/50 w-2 h-2"
                      }`}
                    />
                  ))}
                </View>
              )}

              {/* Image Counter */}
              {hasMultipleImages && (
                <View className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View className="w-full h-full items-center justify-center">
              <MaterialIcons name="directions-bike" size={80} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-6 py-4">
          {/* Title */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text className="text-base text-gray-600 mt-1">
                Năm {vehicle.year} • {vehicle.color}
              </Text>
            </View>
            {vehicle.status === "VERIFIED" && (
              <View className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
                <MaterialIcons name="verified" size={18} color="#22c55e" />
                <Text className="ml-1 text-xs text-green-700 font-medium">
                  Đã duyệt
                </Text>
              </View>
            )}
          </View>

          {/* Price Section */}
          <View className="bg-orange-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600">Giá thuê/ngày</Text>
                <Text className="text-3xl font-bold text-orange-600 mt-1">
                  {dailyRate.toLocaleString("vi-VN")} đ
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-gray-600">Tiền cọc</Text>
                <Text className="text-xl font-semibold text-gray-900 mt-1">
                  {depositAmount.toLocaleString("vi-VN")} đ
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Thông tin chi tiết
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color="#6B7280"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-500">Biển số</Text>
                  <Text className="text-base text-gray-900 font-medium">
                    {vehicle.licensePlate}
                  </Text>
                </View>
              </View>

              {vehicle.fuelType && (
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="local-gas-station"
                    size={20}
                    color="#6B7280"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">Nhiên liệu</Text>
                    <Text className="text-base text-gray-900 font-medium">
                      {vehicle.fuelType === "PETROL"
                        ? "Xăng"
                        : vehicle.fuelType === "ELECTRIC"
                          ? "Điện"
                          : "Hybrid"}
                    </Text>
                  </View>
                </View>
              )}

              {vehicle.transmission && (
                <View className="flex-row items-center">
                  <MaterialIcons name="settings" size={20} color="#6B7280" />
                  <View className="ml-3 flex-1">
                    <Text className="text-sm text-gray-500">Hộp số</Text>
                    <Text className="text-base text-gray-900 font-medium">
                      {vehicle.transmission === "MANUAL"
                        ? "Số sàn"
                        : vehicle.transmission === "AUTOMATIC"
                          ? "Tự động"
                          : "Bán tự động"}
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-center">
                <MaterialIcons name="check-circle" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-500">Trạng thái</Text>
                  <Text className="text-base text-gray-900 font-medium">
                    {vehicle.isAvailable ? "Có sẵn" : "Đang được thuê"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={isFullscreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <View className="flex-1 bg-black">
          {/* Header */}
          <SafeAreaView
            edges={["top"]}
            className="absolute top-0 left-0 right-0 z-10"
          >
            <View className="flex-row items-center justify-between px-4 py-3">
              <TouchableOpacity
                onPress={closeFullscreen}
                className="bg-black/50 rounded-full p-2"
              >
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {hasMultipleImages && (
                <View className="bg-black/50 px-4 py-2 rounded-full">
                  <Text className="text-white text-base font-medium">
                    {fullscreenIndex + 1} / {images.length}
                  </Text>
                </View>
              )}
              <View className="w-10" />
            </View>
          </SafeAreaView>

          {/* Fullscreen Image Carousel */}
          <ScrollView
            ref={fullscreenScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleFullscreenScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={windowWidth}
            snapToAlignment="start"
          >
            {images.map((img, index) => (
              <View
                key={img.id}
                style={{ width: windowWidth, height: windowHeight }}
                className="items-center justify-center"
              >
                <Image
                  source={{ uri: img.url }}
                  style={{ width: windowWidth, height: windowHeight }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          {hasMultipleImages && (
            <SafeAreaView
              edges={["bottom"]}
              className="absolute bottom-0 left-0 right-0"
            >
              <View className="flex-row justify-center items-center pb-4">
                {images.map((_, index) => (
                  <View
                    key={index}
                    className={`mx-1.5 rounded-full ${
                      index === fullscreenIndex
                        ? "bg-white w-2.5 h-2.5"
                        : "bg-white/50 w-2 h-2"
                    }`}
                  />
                ))}
              </View>
            </SafeAreaView>
          )}
        </View>
      </Modal>

      {/* Bottom Action Bar */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <TouchableOpacity
          className="bg-orange-600 rounded-lg px-6 py-4 items-center"
          onPress={handleRent}
          disabled={createRentalMutation.isPending || !vehicle.isAvailable}
        >
          {createRentalMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {vehicle.isAvailable ? "Đặt xe ngay" : "Xe đang được thuê"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
