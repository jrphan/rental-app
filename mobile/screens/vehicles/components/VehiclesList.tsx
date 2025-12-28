import React, { useCallback } from "react";
import { View, Text, FlatList, ListRenderItem, ScrollView } from "react-native";
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
  // Memoize render item to avoid recreating on every render
  const renderItem: ListRenderItem<Vehicle> = useCallback(
    ({ item: vehicle }) => (
      <VehicleCard
        vehicle={vehicle}
        onPress={onVehiclePress}
        variant={variant}
      />
    ),
    [onVehiclePress, variant]
  );

  // Memoize key extractor
  const keyExtractor = useCallback((item: Vehicle) => item.id, []);

  // Item separator component
  const ItemSeparator = useCallback(() => <View style={{ height: 16 }} />, []);

  if (vehicles.length === 0) {
    return (
      <View className="items-center justify-center py-20">
        <MaterialIcons
          name="directions-bike"
          size={64}
          color="#D1D5DB"
          style={{ marginTop: 50 }}
        />
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
          // Performance optimizations for Android
          removeClippedSubviews={true}
          decelerationRate="fast"
          snapToInterval={280}
          snapToAlignment="start"
          disableIntervalMomentum={true}
          // Reduce over-scroll effect on Android
          overScrollMode="never"
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

  // Vertical scroll cho full variant - use FlatList for virtualization
  return (
    <FlatList
      data={vehicles}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
      }}
      showsVerticalScrollIndicator={false}
      className="bg-gray-50"
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
}
