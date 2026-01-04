import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { VehicleItem } from "@/services/api.vehicles";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";

interface VehicleCardProps {
  vehicle: VehicleItem & {
    images?: {
      id: string;
      url: string;
      alt?: string | null;
      isPrimary: boolean;
    }[];
  };
  onPress?: () => void;
  showActionButton?: boolean;
  actionButtonLabel?: string;
  onActionPress?: () => void;
  actionButtonLoading?: boolean;
}

export function VehicleCard({
  vehicle,
  onPress,
  showActionButton = false,
  actionButtonLabel = "Đặt xe",
  onActionPress,
  actionButtonLoading = false,
}: VehicleCardProps) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(windowWidth - 48); // Default: windowWidth - padding (24*2)

  const images = vehicle.images || [];
  const hasMultipleImages = images.length > 1;
  const dailyRate = Number(vehicle.dailyRate) || 0;
  const formattedPrice = dailyRate.toLocaleString("vi-VN");

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(tabs)/vehicles/${vehicle.id}` as any);
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / cardWidth);
    setCurrentIndex(index);
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setCardWidth(width);
  };

  return (
    <View className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-3 shadow-sm">
      {/* Image Carousel */}
      <View
        className="w-full h-72 bg-gray-100 relative"
        onLayout={handleLayout}
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
              snapToInterval={cardWidth}
              snapToAlignment="start"
            >
              {images.map((img, index) => (
                <Image
                  key={img.id}
                  source={{ uri: img.url }}
                  className="h-full"
                  style={{ width: cardWidth }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            {hasMultipleImages && (
              <View className="absolute bottom-3 left-0 right-0 flex-row justify-center items-center">
                {images.map((_, index) => (
                  <View
                    key={index}
                    className={`mx-1 rounded-full ${index === currentIndex
                      ? "bg-white w-2 h-2"
                      : "bg-white/50 w-1.5 h-1.5"
                      }`}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View className="w-full h-full items-center justify-center">
            <MaterialIcons name="directions-bike" size={64} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Content */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="p-4"
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Năm {vehicle.year} • {vehicle.color}
            </Text>
          </View>
          {vehicle.status === "VERIFIED" && (
            <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
              <MaterialIcons name="verified" size={16} color="#22c55e" />
              <Text className="ml-1 text-xs text-green-700 font-medium">
                Đã xác thực
              </Text>
            </View>
          )}
        </View>

        {/* Details */}
        <View className="mb-3">
          <View className="flex-row items-center mb-1">
            <MaterialIcons
              name="confirmation-number"
              size={16}
              color="#6B7280"
            />
            <Text className="ml-2 text-sm text-gray-700">
              Biển số: {vehicle.licensePlate}
            </Text>
          </View>

          {vehicle.fuelType && (
            <View className="flex-row items-center mb-1">
              <MaterialIcons
                name="local-gas-station"
                size={16}
                color="#6B7280"
              />
              <Text className="ml-2 text-sm text-gray-700">
                Nhiên liệu:{" "}
                {vehicle.fuelType === "PETROL"
                  ? "Xăng"
                  : vehicle.fuelType === "ELECTRIC"
                    ? "Điện"
                    : "Hybrid"}
              </Text>
            </View>
          )}

          {vehicle.transmission && (
            <View className="flex-row items-center">
              <MaterialIcons name="settings" size={16} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-700">
                Hộp số:{" "}
                {vehicle.transmission === "MANUAL"
                  ? "Số sàn"
                  : vehicle.transmission === "AUTOMATIC"
                    ? "Tự động"
                    : "Bán tự động"}
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <View>
            <Text className="text-xs text-gray-500">Giá thuê/ngày</Text>
            <Text className="text-xl font-bold text-orange-600">
              {formattedPrice} đ
            </Text>
          </View>
          {vehicle.depositAmount && (
            <View className="items-end">
              <Text className="text-xs text-gray-500">Tiền cọc</Text>
              <Text className="text-sm font-semibold text-gray-700">
                {Number(vehicle.depositAmount).toLocaleString("vi-VN")} đ
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {showActionButton && onActionPress && (
          <TouchableOpacity
            className="bg-orange-600 rounded-lg px-4 py-3 items-center"
            onPress={(e) => {
              e.stopPropagation();
              onActionPress();
            }}
            disabled={actionButtonLoading}
          >
            <Text className="text-white font-semibold">
              {actionButtonLoading ? "Đang xử lý..." : actionButtonLabel}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}
