import React, { useCallback } from "react";
import { View, Text, FlatList, ListRenderItem } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import RentalCard from "./RentalCard";
import type { Rental } from "../types";

interface RentalsListProps {
  rentals: Rental[];
  onRentalPress?: (rental: Rental) => void;
  showOwnerActions?: boolean;
}

export default function RentalsList({
  rentals,
  onRentalPress,
  showOwnerActions = false,
}: RentalsListProps) {
  const router = useRouter();

  const handleRentalPress = useCallback(
    (rental: Rental) => {
      if (onRentalPress) {
        onRentalPress(rental);
      } else {
        router.push(`/rental/${rental.id}`);
      }
    },
    [onRentalPress, router]
  );

  // Memoize render item to avoid recreating on every render
  const renderItem: ListRenderItem<Rental> = useCallback(
    ({ item: rental }) => (
      <RentalCard rental={rental} onPress={handleRentalPress} />
    ),
    [handleRentalPress]
  );

  // Memoize key extractor
  const keyExtractor = useCallback((item: Rental) => item.id, []);

  // Item separator component
  const ItemSeparator = useCallback(() => <View style={{ height: 8 }} />, []);

  if (rentals.length === 0) {
    return (
      <View className="items-center justify-center py-20">
        <MaterialIcons
          name="receipt"
          size={64}
          color="#D1D5DB"
          style={{ marginTop: 20 }}
        />
        <Text className="text-gray-500 mt-4 text-center">
          Không có đơn thuê nào ở trạng thái này
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rentals}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      contentContainerStyle={{
        paddingHorizontal: 16,
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
