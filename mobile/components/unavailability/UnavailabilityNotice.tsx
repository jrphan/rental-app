import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
	count?: number;
	onPress?: () => void;
};

export default function UnavailabilityNotice({ count, onPress }: Props) {
	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.8}
			className="flex-row items-center p-3 rounded-xl border border-red-200 bg-red-50 mb-4"
		>
			<MaterialIcons name="error-outline" size={20} color="#EF4444" />
			<View className="ml-3">
				<Text className="text-sm font-medium text-red-700">
					Khoảng thời gian xe không có sẵn{count ? ` (${count})` : ""}
				</Text>
			</View>
		</TouchableOpacity>
	);
}
