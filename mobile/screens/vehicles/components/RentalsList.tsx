import React, { useState, useCallback } from "react";
import { View, Text, FlatList, ListRenderItem } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import RentalCard from "./RentalCard";
import RentalDetailDrawer from "./RentalDetailDrawer";
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
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleRentalPress = useCallback(
    (rental: Rental) => {
      if (onRentalPress) {
        onRentalPress(rental);
      } else {
        setSelectedRental(rental);
        setDrawerVisible(true);
      }
    },
    [onRentalPress]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setSelectedRental(null);
  }, []);

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
  const ItemSeparator = useCallback(() => <View style={{ height: 16 }} />, []);

  if (rentals.length === 0) {
    return (
      <View className="items-center justify-center py-20">
        <MaterialIcons
          name="receipt"
          size={64}
          color="#D1D5DB"
          style={{ marginTop: 50 }}
        />
        <Text className="text-gray-500 mt-4 text-center">
          Không có đơn thuê nào ở trạng thái này
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={rentals}
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

      <RentalDetailDrawer
        visible={drawerVisible}
        rental={selectedRental}
        onClose={handleCloseDrawer}
        showOwnerActions={showOwnerActions}
      />
    </>
  );
}
