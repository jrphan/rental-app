import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Vehicle } from "../types";
import { formatPrice, getVehicleStatusLabel } from "../utils";
import ChangeVehicleStatusModal from "./ChangeVehicleStatusModal";

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress?: (vehicle: Vehicle) => void;
  variant?: "full" | "compact"; // full: 1 item per row, compact: 1.5 items per row (for horizontal scroll)
}

export default function VehicleCard({
  vehicle,
  onPress,
  variant = "full",
}: VehicleCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Tính toán card width dựa trên variant
  const getCardWidth = React.useCallback(() => {
    if (variant === "compact") {
      // Compact: chiếm khoảng 70% width để hiển thị 1.5 items
      // windowWidth - padding container (16*2) - gap (16)
      return (windowWidth - 48) * 0.7;
    }
    // Full: chiếm toàn bộ width trừ padding
    return windowWidth - 32; // windowWidth - padding (16*2)
  }, [variant, windowWidth]);

  // Card width cố định, không thay đổi khi layout
  const cardWidth = React.useMemo(() => getCardWidth(), [getCardWidth]);

  // Sắp xếp ảnh: ảnh primary đầu tiên, sau đó các ảnh khác
  const sortedImages = React.useMemo(() => {
    if (!vehicle.images || vehicle.images.length === 0) {
      console.log("VehicleCard: No images", vehicle.id, vehicle.images);
      return [];
    }
    // Filter out images without URL
    const validImages = vehicle.images.filter(
      (img) => img.url && img.url.trim() !== ""
    );
    if (validImages.length === 0) {
      console.log(
        "VehicleCard: No valid images with URL",
        vehicle.id,
        vehicle.images
      );
      return [];
    }
    const primary = validImages.find((img) => img.isPrimary);
    const others = validImages.filter((img) => !img.isPrimary);
    const result = primary ? [primary, ...others] : validImages;
    return result;
  }, [vehicle.images, vehicle.id]);

  const hasMultipleImages = sortedImages.length > 1;

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentIndex(index);
  };

  const cardStyle: { width: number; marginRight?: number } =
    variant === "compact"
      ? { width: cardWidth, marginRight: 16 }
      : { width: windowWidth - 32 };

  return (
    <View
      className="bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden"
      style={cardStyle}
    >
      {/* Image Carousel */}
      <View className="w-full h-40 bg-gray-200 relative">
        {sortedImages.length > 0 ? (
          <View className="relative" style={{ width: cardWidth, height: 200 }}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={cardWidth}
              snapToAlignment="start"
            >
              {sortedImages.map((img, index) => (
                <View
                  key={img.id || index}
                  style={{ width: cardWidth, height: 200 }}
                >
                  {img.url ? (
                    <Image
                      source={{ uri: img.url }}
                      style={{ width: cardWidth, height: 200 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-gray-200">
                      <MaterialIcons
                        name="directions-bike"
                        size={48}
                        color="#9CA3AF"
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            {/* Pagination Dots */}
            {hasMultipleImages && (
              <View className="absolute pt-4 top-2 left-0 right-0 flex-row justify-center items-center h-[100px]">
                {sortedImages.map((_, index) => (
                  <View
                    key={index}
                    className={`mx-1 rounded-full ${
                      index === currentIndex
                        ? "bg-white w-2 h-2"
                        : "bg-white/50 w-1.5 h-1.5"
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="w-full h-full items-center justify-center">
            <MaterialIcons name="directions-bike" size={48} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-semibold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              className="p-1"
            >
              <MaterialIcons name="edit" size={18} color="#6B7280" />
            </TouchableOpacity>
            <View className="bg-green-100 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-green-700">
                {getVehicleStatusLabel(vehicle.status)}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="confirmation-number" size={16} color="#6B7280" />
          <Text className="text-sm text-gray-600 ml-1">
            {vehicle.licensePlate}
          </Text>
        </View>
        <View className="flex-row items-center mb-2">
          <MaterialIcons name="location-on" size={16} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
            {vehicle.district}, {vehicle.city}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-500 mr-3">
              {vehicle.year} • {vehicle.color}
            </Text>
            {vehicle.instantBook && (
              <View className="bg-blue-100 px-2 py-0.5 rounded">
                <Text className="text-xs font-medium text-blue-700">
                  Tức thì
                </Text>
              </View>
            )}
          </View>
          <Text className="text-base font-bold text-primary-600">
            {formatPrice(Number(vehicle.pricePerDay))}/ngày
          </Text>
        </View>
      </View>

      <ChangeVehicleStatusModal
        visible={showStatusModal}
        vehicle={vehicle}
        onClose={() => setShowStatusModal(false)}
      />
    </View>
  );
}
