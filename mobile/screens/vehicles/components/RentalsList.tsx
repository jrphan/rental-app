import React from "react";
import { View, Text, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import RentalCard from "./RentalCard";
import type { Rental } from "../types";

interface RentalsListProps {
  rentals: Rental[];
  onRentalPress?: (rental: Rental) => void;
}

export default function RentalsList({
  rentals,
  onRentalPress,
}: RentalsListProps) {
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
      {rentals.map((rental) => (
        <RentalCard key={rental.id} rental={rental} onPress={onRentalPress} />
      ))}
    </ScrollView>
  );
}
