import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatDate } from "@/screens/vehicles/utils";

type Unavailability = {
	startDate: string | Date;
	endDate: string | Date;
	reason?: string | null;
};

type Props = {
	visible: boolean;
	onClose: () => void;
	items: Unavailability[];
};

export default function UnavailabilityModal({ visible, onClose, items }: Props) {
	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableOpacity activeOpacity={1} onPress={onClose} className="flex-1 bg-black/50 justify-end">
				<TouchableOpacity
					activeOpacity={1}
					onPress={(e) => e.stopPropagation()}
					className="w-full bg-white rounded-t-3xl p-6 min-h-[70%]"
				>
					<View className="flex-row items-center justify-between mb-4">
						<Text className="text-lg font-semibold text-gray-900">Xe bận hoặc đã được thuê vào các ngày</Text>
						<TouchableOpacity onPress={onClose}>
							<MaterialIcons name="close" size={22} color="#6B7280" />
						</TouchableOpacity>
					</View>

					<ScrollView>
						{items.length === 0 ? (
							<Text className="text-sm text-gray-500">Không có khoảng thời gian không khả dụng.</Text>
						) : (
							items.map((it, idx) => {
								const from = formatDate(String(it.startDate));
								const to = formatDate(String(it.endDate));
								return (
									<View key={idx} className="mb-3">
										<Text className="text-sm text-red-600">
											Từ {from} đến {to}
										</Text>
										{it.reason ? (
											<Text className="text-xs text-gray-500 mt-1">{it.reason}</Text>
										) : null}
									</View>
								);
							})
						)}
					</ScrollView>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
}
