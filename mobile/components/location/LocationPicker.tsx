import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import MapPickerModal from "./MapPickerModal";
import { parseAddressPartsFromGoogleResult, reverseGeocode } from "@/components/location/addressUtils";

interface LocationPickerProps {
	onLocationSelect: (
		lat: string,
		lng: string,
		addressParts?: {
			address?: string; // street
			fullAddress?: string;
			ward?: string;
			district?: string;
			city?: string;
		}
	) => void;
	currentLat?: string;
	currentLng?: string;
}

export default function LocationPicker({ onLocationSelect, currentLat, currentLng }: LocationPickerProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showMapPicker, setShowMapPicker] = useState(false);

	const getCurrentLocation = async () => {
		try {
			setIsLoading(true);

			// Request permission
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Quyền truy cập vị trí",
					"Ứng dụng cần quyền truy cập vị trí để lấy tọa độ. Vui lòng cấp quyền trong cài đặt.",
					[{ text: "OK" }]
				);
				return;
			}

			// Get current location
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Highest,
			});

			const lat = location.coords.latitude.toString();
			const lng = location.coords.longitude.toString();

			// Try Google reverse geocode to get address parts (more consistent)
			// if (API_KEY) {
				try {
					const parts = await reverseGeocode(lat, lng);
					if (parts) {
						onLocationSelect(lat, lng, {
							address: parts.address,
							fullAddress: parts.fullAddress,
							ward: parts.ward,
							district: parts.district,
							city: parts.city,
						});
						return;
					}
				} catch (err) {
					console.warn("Google reverse geocode failed:", err);
				}
			// }

			// Fallback to Expo reverse geocode if Google unavailable
			try {
				const rev = await Location.reverseGeocodeAsync({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});
				const info = rev && rev[0];
				const address = info
					? [info.name, info.street, info.postalCode, info.subregion, info.region].filter(Boolean).join(", ")
					: undefined;
				const ward = info?.district || info?.subregion || "";
				const district = info?.city || info?.subregion || "";
				const city = info?.region || "";
				onLocationSelect(lat, lng, { address, ward, district, city });
			} catch (err) {
				// fallback: pass coords only
				onLocationSelect(lat, lng);
			}
		} catch (error) {
			console.error("Error getting location:", error);

			// Check if it's a simulator/emulator issue
			const errorMessage = error instanceof Error ? error.message : String(error);
			const isSimulatorError =
				errorMessage.includes("unavailable") ||
				errorMessage.includes("timeout") ||
				errorMessage.includes("no location provider");

			Alert.alert(
				"Không thể lấy vị trí",
				isSimulatorError
					? "Simulator không hỗ trợ GPS. Vui lòng:\n\n1. Set location trong simulator (Features > Location)\n2. Hoặc nhập thủ công tọa độ\n\nVí dụ HCM: 10.762622, 106.660172"
					: "Không thể lấy vị trí hiện tại. Vui lòng thử lại hoặc nhập thủ công.",
				[
					{
						text: "Dùng tọa độ mẫu (HCM)",
						onPress: () => {
							onLocationSelect("10.762622", "106.660172");
						},
					},
					{ text: "Nhập thủ công", style: "cancel" },
				]
			);
		} finally {
			setIsLoading(false);
		}
	};

	const hasLocation = currentLat && currentLng && currentLat !== "" && currentLng !== "";

	return (
		<View>
			<View className="flex-row items-center justify-between mb-2">
				<Text className="text-sm font-medium text-gray-700">Tọa độ địa lý</Text>
				<View className="flex-row gap-2">
					<TouchableOpacity
						onPress={() => setShowMapPicker(true)}
						className="flex-row items-center gap-2 px-3 py-2 bg-blue-100 rounded-lg active:bg-blue-200"
					>
						<MaterialIcons name="map" size={18} color="#2563EB" />
						<Text className="text-sm font-medium text-blue-600">Chọn trên bản đồ</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={getCurrentLocation}
						disabled={isLoading}
						className="flex-row items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg active:bg-orange-200"
					>
						{isLoading ? (
							<ActivityIndicator size="small" color={COLORS.primary} />
						) : (
							<MaterialIcons name="my-location" size={18} color={COLORS.primary} />
						)}
						<Text className="text-sm font-medium text-orange-600">
							{isLoading ? "Đang lấy..." : "Vị trí hiện tại"}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
			{hasLocation && (
				<View className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
					<Text className="text-xs text-green-700">
						✓ Đã lấy vị trí: {parseFloat(currentLat || "0").toFixed(6)},{" "}
						{parseFloat(currentLng || "0").toFixed(6)}
					</Text>
				</View>
			)}
			<Text className="text-xs text-gray-500 mb-2">
				Tọa độ dùng để tìm kiếm xe theo vị trí trên bản đồ. Bạn có thể chọn trên bản đồ, lấy vị trí hiện tại
				hoặc nhập thủ công.
			</Text>

			<MapPickerModal
				visible={showMapPicker}
				onClose={() => setShowMapPicker(false)}
				onSelect={onLocationSelect}
				initialLat={currentLat}
				initialLng={currentLng}
			/>
		</View>
	);
}
