import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import { DatePicker } from "@/components/ui/date-picker";
import { apiVehicle } from "@/services/api.vehicle";
import { apiRental, CreateRentalRequest } from "@/services/api.rental";
import type { Vehicle } from "./types";
import { COLORS } from "@/constants/colors";
import { formatPrice } from "./utils";
import MapPickerModal from "@/components/location/MapPickerModal";

export default function BookingScreen() {
	const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [deliveryFee, setDeliveryFee] = useState<number>(0);
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery" | null>("pickup");
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [deliveryAddress, setDeliveryAddress] = useState<{
		address?: string;
		ward?: string;
		district?: string;
		city?: string;
		lat?: number;
		lng?: number;
	} | null>(null);

	// Fetch vehicle details
	const { data: vehicle, isLoading } = useQuery<Vehicle>({
		queryKey: ["vehicle", vehicleId],
		queryFn: () => {
			if (!vehicleId) throw new Error("Vehicle ID is required");
			return apiVehicle.getVehicleDetail(vehicleId);
		},
		enabled: !!vehicleId,
	});

	// Create rental mutation
	const createRentalMutation = useMutation({
		mutationFn: async (data: CreateRentalRequest) => {
			return apiRental.createRental(data);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["rental"] });
			Alert.alert("Thành công", data.message, [
				{
					text: "Xem đơn thuê",
					onPress: () => {
						router.replace(`/(tabs)/vehicles?rentalId=${data.rental.id}`);
					},
				},
				{
					text: "OK",
					style: "cancel",
					onPress: () => router.back(),
				},
			]);
		},
		onError: (error: any) => {
			Alert.alert("Lỗi", error.message || "Tạo đơn thuê thất bại");
		},
	});

	const handleSubmit = () => {
		if (!vehicleId || !startDate || !endDate) {
			Alert.alert("Lỗi", "Vui lòng chọn ngày bắt đầu và ngày kết thúc");
			return;
		}

		// If delivery option selected, require an address
		if (deliveryOption === "delivery") {
			if (!vehicle?.deliveryAvailable) {
				Alert.alert("Lỗi", "Chủ xe không hỗ trợ giao xe tận nơi");
				return;
			}
			if (!deliveryAddress) {
				Alert.alert("Lỗi", "Vui lòng chọn địa điểm giao xe");
				return;
			}
		}

		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start >= end) {
			Alert.alert("Lỗi", "Ngày kết thúc phải sau ngày bắt đầu");
			return;
		}

		if (start < new Date()) {
			Alert.alert("Lỗi", "Ngày bắt đầu không được trong quá khứ");
			return;
		}

		createRentalMutation.mutate({
			vehicleId,
			startDate: start.toISOString(),
			endDate: end.toISOString(),
			deliveryFee,
			discountAmount,
			// Optional fields to be accepted by backend in future — safe to send
			deliveryOption: deliveryOption,
			deliveryAddress: deliveryAddress?.address || deliveryAddress?.fullAddress || undefined,
			deliveryLat: deliveryAddress?.lat,
			deliveryLng: deliveryAddress?.lng,
		});
	};

	// Calculate price summary
	const calculateSummary = () => {
		if (!vehicle || !startDate || !endDate) {
			return {
				durationDays: 0,
				basePrice: 0,
				deliveryFee: 0,
				discountAmount: 0,
				totalPrice: 0,
				depositAmount: Number(vehicle?.depositAmount || 0),
			};
		}

		const start = new Date(startDate);
		const end = new Date(endDate);
		const durationMs = end.getTime() - start.getTime();
		const durationMinutes = Math.floor(durationMs / (1000 * 60));
		const durationDays = Math.ceil(durationMinutes / (60 * 24)); // Round up to days

		const basePrice = Number(vehicle.pricePerDay) * durationDays;
		const totalPrice = basePrice + deliveryFee - discountAmount;
		const depositAmount = Number(vehicle.depositAmount || 0);

		return {
			durationDays,
			basePrice,
			deliveryFee,
			discountAmount,
			totalPrice,
			depositAmount,
		};
	};

	const summary = calculateSummary();

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<HeaderBase title="Đặt xe" showBackButton />
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text className="mt-4 text-gray-600">Đang tải thông tin...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!vehicle) {
		return (
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<HeaderBase title="Đặt xe" showBackButton />
				<View className="flex-1 items-center justify-center px-4">
					<MaterialIcons name="error-outline" size={64} color="#EF4444" />
					<Text className="mt-4 text-red-600 text-center">Không tìm thấy thông tin xe</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
			<HeaderBase title="Đặt xe" showBackButton />
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-4 pt-4">
					{/* Vehicle Info Summary */}
					<View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
						<Text className="text-lg font-bold text-gray-900 mb-2">
							{vehicle.brand} {vehicle.model}
						</Text>
						<Text className="text-sm text-gray-600 mb-1">
							Năm {vehicle.year} • {vehicle.color}
						</Text>
						<Text className="text-sm text-gray-600 mb-3">Biển số: {vehicle.licensePlate}</Text>
						<View className="flex-row items-center justify-between">
							<Text className="text-sm text-gray-600">Giá thuê/ngày:</Text>
							<Text className="text-lg font-bold text-orange-600">
								{formatPrice(Number(vehicle.pricePerDay))}
							</Text>
						</View>
					</View>

					{/* Date Selection */}
					<View className="mb-4">
						<DatePicker
							label="Ngày bắt đầu"
							value={startDate}
							onChange={(value) => setStartDate(value)}
							placeholder="Chọn ngày bắt đầu"
							minimumDate={new Date()}
						/>

						<DatePicker
							label="Ngày kết thúc"
							value={endDate}
							onChange={(value) => setEndDate(value)}
							placeholder="Chọn ngày kết thúc"
							minimumDate={
								startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000) : new Date()
							}
						/>
					</View>

					{/* Delivery / Pickup options */}
					<View className="mb-4">
						<Text className="text-sm text-gray-600 mb-2">Hình thức nhận/giao xe</Text>
						{/* Pickup */}
						<TouchableOpacity
							onPress={() => setDeliveryOption("pickup")}
							activeOpacity={0.8}
							className={`p-4 rounded-xl mb-2 ${deliveryOption === "pickup" ? "border border-gray-200 bg-white" : "bg-gray-50 border border-gray-200"}`}
						>
							<View className="flex-row items-center">
								<MaterialIcons
									name={
										deliveryOption === "pickup" ? "radio-button-checked" : "radio-button-unchecked"
									}
									size={20}
									color={deliveryOption === "pickup" ? COLORS.primary : "#6B7280"}
								/>
								<View className="ml-3">
									<Text className="font-semibold text-gray-900">Tôi tự đến lấy xe</Text>
									<Text className="text-sm text-gray-700 mt-1">
										{vehicle.ward ? `, ${vehicle.ward}` : ""}
										{vehicle.district ? `, ${vehicle.district}` : ""}
									</Text>
								</View>
							</View>
						</TouchableOpacity>

						{/* Delivery */}
						<TouchableOpacity
							onPress={() => {
								if (!vehicle?.deliveryAvailable) return;
								// open map picker to choose address
								setShowMapPicker(true);
							}}
							activeOpacity={vehicle?.deliveryAvailable ? 0.8 : 1}
							disabled={!vehicle?.deliveryAvailable}
							className={`p-4 rounded-xl mb-2 ${deliveryOption === "delivery" ? "border border-gray-200 bg-white" : vehicle?.deliveryAvailable ? "bg-gray-50 border border-gray-200" : "bg-gray-200"}`}
						>
							<View className="flex-row items-start">
								<MaterialIcons
									name={
										deliveryOption === "delivery"
											? "radio-button-checked"
											: "radio-button-unchecked"
									}
									size={20}
									color={deliveryOption === "delivery" ? COLORS.primary : "#6B7280"}
								/>
								<View className="ml-3 flex-1">
									<Text className="font-semibold text-gray-900">Tôi muốn được giao xe tận nơi</Text>
									{vehicle?.deliveryAvailable ? (
										deliveryAddress ? (
											<Text className="text-sm text-gray-700 mt-1">
												{deliveryAddress.address || ""}
												{deliveryAddress.ward ? `, ${deliveryAddress.ward}` : ""}
												{deliveryAddress.district ? `, ${deliveryAddress.district}` : ""}
												{deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}
											</Text>
										) : (
											<Text className="text-sm text-gray-500 mt-1">Chọn địa điểm giao xe</Text>
										)
									) : (
										<Text className="text-sm text-gray-600 mt-1">
											Chủ xe không hỗ trợ giao xe tận nơi
										</Text>
									)}
								</View>
							</View>
						</TouchableOpacity>
					</View>
					{/* Map picker modal */}
					<MapPickerModal
						visible={showMapPicker}
						onClose={() => setShowMapPicker(false)}
						onSelect={(lat, lng, addressParts) => {
							setShowMapPicker(false);
							setDeliveryOption("delivery");
							setDeliveryAddress({
								address: addressParts?.address || addressParts?.fullAddress || "",
								ward: addressParts?.ward,
								district: addressParts?.district,
								city: addressParts?.city,
								lat: Number(lat),
								lng: Number(lng),
							});
						}}
						initialLat={undefined}
						initialLng={undefined}
					/>

					{/* Price Summary */}
					{startDate && endDate && (
						<View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
							<Text className="text-lg font-bold text-gray-900 mb-3">Tóm tắt giá</Text>

							<View className="flex-row justify-between mb-2">
								<Text className="text-sm text-gray-600">Giá cơ bản ({summary.durationDays} ngày)</Text>
								<Text className="text-sm font-semibold text-gray-900">
									{formatPrice(summary.basePrice)}
								</Text>
							</View>

							{summary.deliveryFee > 0 && (
								<View className="flex-row justify-between mb-2">
									<Text className="text-sm text-gray-600">Phí giao xe</Text>
									<Text className="text-sm font-semibold text-gray-900">
										{formatPrice(summary.deliveryFee)}
									</Text>
								</View>
							)}

							{summary.discountAmount > 0 && (
								<View className="flex-row justify-between mb-2">
									<Text className="text-sm text-gray-600">Giảm giá</Text>
									<Text className="text-sm font-semibold text-green-600">
										-{formatPrice(summary.discountAmount)}
									</Text>
								</View>
							)}

							<View className="border-t border-orange-200 pt-2 mt-2">
								<View className="flex-row justify-between mb-2">
									<Text className="text-base font-bold text-gray-900">Tổng cộng</Text>
									<Text className="text-xl font-bold text-orange-600">
										{formatPrice(summary.totalPrice)}
									</Text>
								</View>

								{summary.depositAmount > 0 && (
									<View className="flex-row justify-between">
										<Text className="text-sm text-gray-600">Tiền cọc</Text>
										<Text className="text-sm font-semibold text-gray-900">
											{formatPrice(summary.depositAmount)}
										</Text>
									</View>
								)}
							</View>
						</View>
					)}

					{/* Submit Button */}
					<TouchableOpacity
						onPress={handleSubmit}
						disabled={!startDate || !endDate || createRentalMutation.isPending}
						className={`rounded-xl p-4 mb-4 ${
							!startDate || !endDate || createRentalMutation.isPending ? "bg-gray-300" : "bg-orange-600"
						}`}
						style={
							!startDate || !endDate || createRentalMutation.isPending
								? {}
								: { backgroundColor: COLORS.primary }
						}
					>
						{createRentalMutation.isPending ? (
							<View className="flex-row items-center justify-center">
								<ActivityIndicator size="small" color="#FFFFFF" />
								<Text className="ml-2 text-lg font-semibold text-white">Đang xử lý...</Text>
							</View>
						) : (
							<Text className="text-lg font-semibold text-white text-center">Xác nhận đặt xe</Text>
						)}
					</TouchableOpacity>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
