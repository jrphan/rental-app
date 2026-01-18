import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import type { VehicleOwner } from "@/screens/vehicles/types";

/**
 * Reusable Owner info card used in VehicleDetailScreen and RentalDetailDrawer
 */
export default function OwnerInfo({ owner, ownerId }: { owner: VehicleOwner | undefined | null; ownerId: string }) {
	const router = useRouter();
	if (!owner) return null;

	const handlePress = () => {
		const params = new URLSearchParams({
			ownerName: owner.fullName || "Người dùng",
		});
		if (owner.avatar) params.append("ownerAvatar", owner.avatar);
		if (owner.email) params.append("ownerEmail", owner.email);
		if (owner.phone) params.append("ownerPhone", owner.phone);
		router.push(`/owner/${ownerId}?${params.toString()}`);
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.75}
			className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4"
		>
			<View className="flex-row items-center">
				{owner.avatar ? (
					<Image source={{ uri: owner.avatar }} className="w-16 h-16 rounded-full mr-3" />
				) : (
					<View className="w-16 h-16 rounded-full mr-3 bg-gray-300 items-center justify-center">
						<MaterialIcons name="account-circle" size={40} color="#9CA3AF" />
					</View>
				)}
				<View className="flex-1">
					<View className="flex-row items-center justify-between">
						<Text className="text-base font-semibold text-gray-900">{owner.fullName || "Chủ xe"}</Text>
						<MaterialIcons name="chevron-right" size={24} color="#6B7280" />
					</View>
					<View className="flex-row items-center mt-1">
						<MaterialIcons name="phone" size={16} color="#6B7280" />
						<Text className="ml-1 text-sm text-gray-600">{owner.phone || ""}</Text>
					</View>
					{owner.email ? (
						<View className="flex-row items-center mt-1">
							<MaterialIcons name="email" size={16} color="#6B7280" />
							<Text className="ml-1 text-sm text-gray-600">{owner.email}</Text>
						</View>
					) : null}
					<View className="flex-row items-center mt-2">
						<Text className="text-sm text-primary-600 font-medium">Xem hồ sơ</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}
