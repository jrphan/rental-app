import React from "react";
import { View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface VehicleStatsProps {
	completedTrips: number;
	rating?: number;
	compact?: boolean;
}

/**
 * Component hiển thị thống kê xe (số chuyến, rating)
 * Tái sử dụng ở MiniVehicleCard, VehicleCard, VehicleDetailScreen
 */
export default function VehicleStats({ completedTrips, rating, compact = false }: VehicleStatsProps) {
	if (compact) {
		return (
			<View className="flex-row items-center mt-2">
				{rating !== undefined && rating > 0 && (
					<>
						<View className="flex-row items-center mr-2">
							<MaterialIcons name="star" size={12} color="#F59E0B" />
							<Text className="text-xs font-bold text-gray-700 ml-0.5" numberOfLines={1}>
								{rating.toFixed(1)}
							</Text>
						</View>
						<Text className="text-xs text-gray-600">•  </Text>
					</>
				)}
				<View className="flex-row items-center">
					<MaterialIcons name="local-shipping" size={12} color="#10B981" />
					<Text className="text-xs text-gray-700 ml-1">{completedTrips || "Chưa có"} chuyến</Text>
				</View>
			</View>
		);
	}

	return (
		<View className="flex-row items-center">
			{rating !== undefined && rating > 0 && (
				<View className="flex-row items-center mr-3 mb-2">
					<MaterialIcons name="star" size={16} color="#F59E0B" />
					<Text className="ml-1 text-sm text-gray-700">{rating.toFixed(1)} • </Text>
				</View>
			)}
			<View className="flex-row items-center mb-2">
				<MaterialIcons name="local-shipping" size={16} color="#10B981" />
				<Text className="ml-1 text-sm text-gray-700">{completedTrips || "Chưa có"} chuyến</Text>
			</View>
		</View>
	);
}
