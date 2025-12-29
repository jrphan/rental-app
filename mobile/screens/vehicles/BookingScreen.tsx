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
import PromoModal from "@/components/promo/PromoModal";
import { PROMOS, type Promo } from "@/constants/promos";
import { calculateDistanceKm } from "@/utils/geo";

export default function BookingScreen() {
	const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [deliveryFee, setDeliveryFee] = useState<number>(0);
	const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(null);
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [deliveryAddress, setDeliveryAddress] = useState<{
		fullAddress?: string;
		address?: string;
		ward?: string;
		district?: string;
		city?: string;
		lat?: number;
		lng?: number;
	} | null>(null);
	const [showPromoModal, setShowPromoModal] = useState(false);
	const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);

	// Promo apply handler (client-side demo)
	const applyPromo = (promo?: Promo, inputCode?: string) => {
		setSelectedPromo(promo || null);
		// Reset discount
		setDiscountAmount(0);
		if (!promo && !inputCode) return;
		// try match inputCode to promos
		const matched = promo ? promo : PROMOS.find((p) => p.code.toUpperCase() === (inputCode || "").toUpperCase());
		if (!matched) {
			Alert.alert("Mã khuyến mại", "Mã không hợp lệ (demo).");
			return;
		}
		// compute discount preview
		const start = new Date(startDate || "");
		const end = new Date(endDate || "");
		const durationDays =
			startDate && endDate ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 1;
		const base = Number(vehicle?.pricePerDay || 0) * durationDays;
		if (matched.type === "FREESHIP") {
			setDiscountAmount(Number(deliveryFee));
			Alert.alert("Mã khuyến mại", `${matched.title} đã được áp dụng`);
		} else if (matched.type === "PERCENT") {
			let disc = Math.floor((base * matched.value) / 100);
			if (matched.maxAmount) disc = Math.min(disc, matched.maxAmount);
			setDiscountAmount(disc);
			Alert.alert("Mã khuyến mại", `${matched.title} đã được áp dụng`);
		} else if (matched.type === "FIXED") {
			setDiscountAmount(matched.value);
			Alert.alert("Mã khuyến mại", `${matched.title} đã được áp dụng`);
		}
	};

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
		if (deliveryAddress) {
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
			// send deliveryAddress only when delivery selected
			deliveryAddress: deliveryAddress
				? {
						fullAddress: deliveryAddress.fullAddress || "",
						address: deliveryAddress.address || "",
						ward: deliveryAddress.ward,
						district: deliveryAddress.district,
						city: deliveryAddress.city,
						lat: deliveryAddress.lat ?? null,
						lng: deliveryAddress.lng ?? null,
					}
				: undefined,
		});
	};

	// Calculate price summary
	const calculateSummary = () => {
		if (!vehicle || !startDate || !endDate) {
			return {
				durationDays: 0,
				basePrice: 0,
				deliveryFee: deliveryFee,
				discountAmount: discountAmount,
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
							onPress={() => setDeliveryAddress(null)}
							activeOpacity={0.8}
							className={`p-4 rounded-xl mb-2 ${!deliveryAddress ? "bg-white border border-gray-200" : "bg-gray-50 border border-gray-200"}`}
						>
							<View className="flex-row items-center">
								<MaterialIcons
									name={!deliveryAddress ? "radio-button-checked" : "radio-button-unchecked"}
									size={20}
									color={!deliveryAddress ? COLORS.primary : "#6B7280"}
								/>
								<View className="ml-3">
									<Text className="font-semibold text-gray-900">Tôi tự đến lấy xe</Text>
									<Text className="text-sm text-gray-700 mt-1">
										{vehicle.address || ""}
										{vehicle.ward ? `, ${vehicle.ward}` : ""}
										{vehicle.district ? `, ${vehicle.district}` : ""}
										{vehicle.city ? `, ${vehicle.city}` : ""}
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
							className={`p-4 rounded-xl mb-2 ${deliveryAddress ? "bg-white border border-gray-200" : vehicle?.deliveryAvailable ? "bg-gray-50 border border-gray-200" : "bg-gray-100 border border-gray-200 opacity-50"}`}
						>
							<View className="flex-row items-start">
								<MaterialIcons
									name={deliveryAddress ? "radio-button-checked" : "radio-button-unchecked"}
									size={20}
									color={deliveryAddress ? COLORS.primary : "#6B7280"}
								/>
								<View className="ml-3 flex-1">
									<Text className="font-semibold text-gray-900">
										{vehicle?.deliveryAvailable
											? "Tôi muốn được giao xe tận nơi"
											: "Chủ xe không hỗ trợ giao xe tận nơi"}
									</Text>
									{vehicle?.deliveryAvailable &&
										(deliveryAddress ? (
											<Text className="text-sm text-gray-700 mt-1">
												{deliveryAddress.address || ""}
												{deliveryAddress.ward ? `, ${deliveryAddress.ward}` : ""}
												{deliveryAddress.district ? `, ${deliveryAddress.district}` : ""}
												{deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}
											</Text>
										) : (
											<Text className="text-sm text-gray-500 mt-1">Chọn địa điểm giao xe</Text>
										))}
								</View>
								{/* show distance when chosen */}
								{deliveryDistanceKm != null && deliveryAddress && (
									<View style={{ justifyContent: "center", marginLeft: 8 }}>
										<Text style={{ color: "#10B981", fontWeight: "700" }}>
											{deliveryDistanceKm.toFixed(1)} km
										</Text>
									</View>
								)}
							</View>
						</TouchableOpacity>
					</View>
					{/* Map picker modal */}
					<MapPickerModal
						visible={showMapPicker}
						onClose={() => setShowMapPicker(false)}
						onSelect={(lat, lng, addressParts) => {
							setShowMapPicker(false);
							if (!vehicle || vehicle.lat == null || vehicle.lng == null) {
								// fallback: set address but fee = 0
								setDeliveryAddress({
									fullAddress: addressParts?.fullAddress,
									address: addressParts?.address,
									ward: addressParts?.ward,
									district: addressParts?.district,
									city: addressParts?.city,
									lat: Number(lat),
									lng: Number(lng),
								});
								return;
							}

							const dist = calculateDistanceKm(
								Number(vehicle.lat),
								Number(vehicle.lng),
								Number(lat),
								Number(lng)
							);
							// check radius if configured
							const radius = vehicle.deliveryRadiusKm ?? 0;
							if (radius > 0 && dist > radius) {
								Alert.alert("Lỗi", `Vượt giới hạn giao: ${dist.toFixed(1)} km (max ${radius} km)`);
								return;
							}

							// compute fee (round km * feePerKm) + base, fallback to 0
							// feePerKm default 10,000 VND/km
							const feePerKm = Number((vehicle as any).deliveryFeePerKm ?? 10000);
							const calc = Math.round(dist) * feePerKm;

							setDeliveryAddress({
								fullAddress: addressParts?.fullAddress,
								address: addressParts?.address,
								ward: addressParts?.ward,
								district: addressParts?.district,
								city: addressParts?.city,
								lat: Number(lat),
								lng: Number(lng),
							});
							setDeliveryFee(calc);
							setDeliveryDistanceKm(dist);
						}}
						initialLat={undefined}
						initialLng={undefined}
					/>

					{/* Price Summary */}
					{/* Coupon preview (demo) */}
					{startDate && endDate && (
						<>
							<View className="mb-4">
								<TouchableOpacity
									onPress={() => setShowPromoModal(true)}
									style={{
										borderWidth: 1,
										borderColor: "#E5E7EB",
										borderRadius: 8,
										padding: 12,
										display: "flex",
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<Text style={{ color: "#374151" }}>
										{selectedPromo
											? `${selectedPromo.title} · ${selectedPromo.code}`
											: "Chọn mã khuyến mãi"}
									</Text>
									{selectedPromo && (
										<TouchableOpacity
											onPress={() => {
												setSelectedPromo(null);
												setDiscountAmount(0);
											}}
										>
											<MaterialIcons name="close" size={20} />
										</TouchableOpacity>
									)}
								</TouchableOpacity>
							</View>
							<PromoModal
								visible={showPromoModal}
								selected={selectedPromo ?? undefined}
								onClose={() => setShowPromoModal(false)}
								onApply={applyPromo}
							/>
							<View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
								<Text className="text-lg font-bold text-gray-900 mb-3">Tóm tắt giá</Text>

								<View className="flex-row justify-between mb-2">
									<Text className="text-sm text-gray-600">
										Giá cơ bản ({summary.durationDays} ngày)
									</Text>
									<Text className="text-sm font-semibold text-gray-900">
										{formatPrice(summary.basePrice)}
									</Text>
								</View>

								{summary.deliveryFee > 0 && (
									<View className="flex-row justify-between mb-2">
										<Text className="text-sm text-gray-600">
											Phí giao xe <Text style={{ color: "#9CA3AF" }}>(10.000đ/km)</Text>
										</Text>
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
						</>
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
