import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Rental } from "../types";
import {
  formatPrice,
  formatDate,
  getRentalStatusColor,
  getRentalStatusLabel,
} from "../utils";

interface RentalCardProps {
  rental: Rental;
  onPress?: (rental: Rental) => void;
}

export default function RentalCard({ rental, onPress }: RentalCardProps) {
  const primaryImage =
    rental.vehicle.images?.find((img) => img.isPrimary)?.url ||
    rental.vehicle.images?.[0]?.url ||
    "https://via.placeholder.com/300x200?text=No+Image";

  const handlePress = () => {
    if (onPress) {
      onPress(rental);
    }
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mb-3 border border-gray-200 overflow-hidden"
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className="flex-row">
        <Image
          source={{ uri: primaryImage }}
          className="w-24 h-24 bg-gray-200"
          resizeMode="cover"
        />
        <View className="flex-1 p-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-base font-semibold text-gray-900 flex-1"
              numberOfLines={1}
            >
              {rental.vehicle.brand} {rental.vehicle.model}
            </Text>
            <View
              className={`px-2 py-1 rounded ${getRentalStatusColor(rental.status)}`}
            >
              <Text className="text-xs font-medium">
                {getRentalStatusLabel(rental.status)}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-500 mb-2">
            {rental.vehicle.licensePlate}
          </Text>
          <View className="flex-row items-center mb-1">
            <MaterialIcons name="calendar-today" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 ml-1">
              {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
            </Text>
          </View>
          {rental.deliveryFee > 0 && (
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="local-shipping" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                Phí giao: {formatPrice(rental.deliveryFee)}
              </Text>
            </View>
          )}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-sm font-bold text-primary-600">
              {formatPrice(rental.totalPrice)}
            </Text>
            {rental.discountAmount > 0 && (
              <Text className="text-xs text-green-600">
                -{formatPrice(rental.discountAmount)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
