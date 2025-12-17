import React from "react";
import { View, Text, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import VehicleCard from "./VehicleCard";
import type { Vehicle } from "../types";

interface VehiclesListProps {
  vehicles: Vehicle[];
  onVehiclePress?: (vehicle: Vehicle) => void;
  variant?: "full" | "compact"; // full: vertical scroll, compact: horizontal scroll
}

export default function VehiclesList({
  vehicles,
  onVehiclePress,
  variant = "full",
}: VehiclesListProps) {
  if (vehicles.length === 0) {
    return (
      <View className="items-center justify-center py-20 bg-gray-50">
        <MaterialIcons name="directions-bike" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 mt-4 text-center">
          Không có xe nào ở trạng thái này
        </Text>
      </View>
    );
  }

  // Horizontal scroll cho compact variant (mặc định)
  if (variant === "compact") {
    return (
      <View className="bg-gray-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}
        >
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={onVehiclePress}
              variant="compact"
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // Vertical scroll cho full variant
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
      }}
      showsVerticalScrollIndicator={false}
      className="bg-gray-50"
    >
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onPress={onVehiclePress}
          variant={variant}
        />
      ))}
    </ScrollView>
  );
}
