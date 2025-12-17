import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function MiniVehicleCard({ vehicle, distanceKm }: any) {
	const router = useRouter();
	const daily = Number(vehicle.dailyRate) || 0;
	return (
		<TouchableOpacity
			onPress={() => {
				router.push({
					pathname: "/(tabs)/vehicles/[id]",
					params: { id: vehicle.id },
				});
			}}
			className="bg-white rounded-2xl p-3 mr-3 shadow"
			style={{ width: 260 }}
			activeOpacity={0.8}
		>
			<View className="flex-row">
				<Image
					source={{ uri: (vehicle.images && vehicle.images[0]?.url) || undefined }}
					style={{ width: 80, height: 60, borderRadius: 8 }}
					resizeMode="cover"
				/>
				<View className="ml-3 flex-1">
					<Text className="text-sm font-semibold text-gray-900">
						{vehicle.brand} {vehicle.model}
					</Text>
					<Text className="text-xs text-gray-500 mt-1">
						{distanceKm ? `${distanceKm.toFixed(1)} km` : "-"}
					</Text>
					<View className="flex-row items-center mt-2">
						<MaterialIcons name="star" size={14} color="#F59E0B" />
						<Text className="ml-1 text-xs text-gray-700">5.0</Text>
						<Text className="ml-2 text-xs text-gray-500">• {vehicle.rentalsCount ?? 0} chuyến</Text>
					</View>
				</View>
			</View>
			<View className="mt-3 flex-row items-center justify-between">
				<Text className="text-base font-bold text-orange-600">{daily.toLocaleString("vi-VN")} đ</Text>
				<View className="bg-primary-100 rounded-full px-2 py-1">
					<Text className="text-xs text-primary-700">/ngày</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}
