import React from "react";
import { router } from "expo-router";
import { View, Text, Image, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Rental } from "../types";
import { formatPrice, formatDate, getRentalStatusLabel, getRentalStatusStyles } from "../utils";

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
				<Image source={{ uri: primaryImage }} className="w-24 h-24 bg-gray-200" resizeMode="cover" />
				<View className="flex-1 p-3">
					<View className="flex-row items-center justify-between mb-1">
						<Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
							{rental.vehicle.brand} {rental.vehicle.model}
						</Text>
						{(() => {
							const s = getRentalStatusStyles(rental.status);
							return (
								<View
									style={{
										paddingHorizontal: 8,
										paddingVertical: 4,
										borderRadius: 999,
										backgroundColor: s.backgroundColor,
									}}
								>
									<Text style={{ fontSize: 12, color: s.color, fontWeight: "500" }}>
										{getRentalStatusLabel(rental.status)}
									</Text>
								</View>
							);
						})()}
					</View>
					<View className="flex-row justify-between">
						<View>
							<Text className="text-xs text-gray-500 mb-2">{rental.vehicle.licensePlate}</Text>
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
							{rental.insuranceFee > 0 && (
								<View className="flex-row items-center mb-1">
									<MaterialIcons name="shield" size={14} color="#6B7280" />
									<Text className="text-xs text-gray-500 ml-1">
										Bảo hiểm: {formatPrice(rental.insuranceFee)}
									</Text>
								</View>
							)}
						</View>
						{/* Rebook button for completed / cancelled */}
						{(rental.status === "COMPLETED" || rental.status === "CANCELLED") && (
							<TouchableOpacity
								onPress={() => router.push(`/vehicle/${rental.vehicle.id}`)}
								activeOpacity={0.8}
								style={{
									marginTop: 4,
									alignSelf: "flex-start",
									paddingHorizontal: 16,
									paddingVertical: 3,
									borderRadius: 10,
									borderWidth: 1,
									borderColor: "#F59E0B",
									backgroundColor: "#ffd386ff",
								}}
							>
								<Text style={{ color: "#111827", fontWeight: "600" }}>Đặt lại</Text>
							</TouchableOpacity>
						)}
					</View>
					<View className="flex-row items-center justify-between mt-1">
						<Text className="text-sm font-bold text-primary-600">{formatPrice(rental.totalPrice)}</Text>
						{rental.discountAmount > 0 && (
							<Text className="text-xs text-green-600">-{formatPrice(rental.discountAmount)}</Text>
						)}
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}
