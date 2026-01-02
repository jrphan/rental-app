import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from "react-native";
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
import UnavailabilityNotice from "@/components/unavailability/UnavailabilityNotice";
import UnavailabilityModal from "@/components/unavailability/UnavailabilityModal";
import { useFeeSettings } from "@/hooks/useFeeSettings";
import InsuranceInfoModal from "@/components/insurance/InsuranceInfoModal";
import { DELIVERY_FEE_PER_KM } from "@/constants/deliveryFee";

export default function BookingScreen() {
	const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { deliveryFeePerKm, getInsuranceRate } = useFeeSettings();

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [deliveryFee, setDeliveryFee] = useState<number>(0);
	const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number | null>(null);

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
	const [unavailModalVisible, setUnavailModalVisible] = useState(false);
	const [insuranceSelected, setInsuranceSelected] = useState(false);
	const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);

	// Fetch vehicle details
	const { data: vehicle, isLoading } = useQuery<Vehicle>({
		queryKey: ["vehicle", vehicleId],
		queryFn: () => {
			if (!vehicleId) throw new Error("Vehicle ID is required");
			return apiVehicle.getVehicleDetail(vehicleId);
		},
		enabled: !!vehicleId,
	});

	// --- LOGIC TÍNH TOÁN GIÁ & DISCOUNT (Cập nhật tự động) ---

	// 1. Tính số ngày thuê (Duration Days)
	const durationDays = useMemo(() => {
		if (!startDate || !endDate) return 0;
		const start = new Date(startDate);
		const end = new Date(endDate);
		if (start > end) return 0;
		const durationMs = end.getTime() - start.getTime();
		const durationMinutes = Math.floor(durationMs / (1000 * 60));
		return Math.ceil(durationMinutes / (60 * 24)); // Round up to days
	}, [startDate, endDate]);

	// 2. Tính giá cơ bản (Base Price)
	const basePrice = useMemo(() => {
		if (!vehicle) return 0;
		return Number(vehicle.pricePerDay) * durationDays;
	}, [vehicle, durationDays]);

	// 3. Tính Discount Amount (Derived State - Tự động cập nhật)
	const discountAmount = useMemo(() => {
		if (!selectedPromo) return 0;

		// Trường hợp FREESHIP
		if (selectedPromo.type === "FREESHIP") {
			// Nếu phí ship = 0 (tự đến lấy), giảm giá = 0
			// Nếu có phí ship, giảm giá = phí ship
			return deliveryFee;
		}

		// Trường hợp PERCENT (Phần trăm)
		if (selectedPromo.type === "PERCENT") {
			let disc = Math.floor((basePrice * selectedPromo.value) / 100);
			if (selectedPromo.maxAmount) disc = Math.min(disc, selectedPromo.maxAmount);
			return disc;
		}

		// Trường hợp FIXED (Giảm tiền mặt cố định)
		if (selectedPromo.type === "FIXED") {
			// Nếu chưa đạt minAmount thì coi như không giảm (trước khi bị gỡ bởi useEffect)
			if (selectedPromo.minAmount && basePrice < selectedPromo.minAmount) {
				return 0;
			}
			return selectedPromo.value;
		}

		return 0;
	}, [selectedPromo, basePrice, deliveryFee]);

	// 4. Theo dõi thay đổi giá để kiểm tra điều kiện mã giảm giá (Side Effect)
	useEffect(() => {
		if (!selectedPromo) return;

		if (selectedPromo.type === "FREESHIP" && deliveryFee === 0)
			setSelectedPromo(null);

		// Kiểm tra đơn tối thiểu cho mã FIXED khi basePrice thay đổi
		if (selectedPromo.type === "FIXED" && selectedPromo.minAmount) {
			// Chỉ check khi đã có giá cơ bản
			if (basePrice > 0 && basePrice < selectedPromo.minAmount) {
				Alert.alert(
					// "Mã giảm giá hết hiệu lực",
					`Đơn không đạt tối thiểu ${formatPrice(selectedPromo.minAmount)} do thay đổi ngày thuê. Mã đã bị hủy.`
				);
				setSelectedPromo(null);
			}
		}
	}, [basePrice, selectedPromo, deliveryFee]);


	// Promo apply handler (Updated)
	const applyPromo = (promo?: Promo, inputCode?: string) => {
		if (!promo && !inputCode) {
			setSelectedPromo(null);
			return;
		}

		// Tìm mã phù hợp
		const matched = promo ? promo : PROMOS.find((p) => p.code.toUpperCase() === (inputCode || "").toUpperCase());

		if (!matched) {
			Alert.alert("Mã khuyến mại", "Mã không hợp lệ (demo).");
			return;
		}

		// Validate ngay tại thời điểm áp dụng
		// Lưu ý: Dùng basePrice hiện tại (đã tính toán từ useMemo)
		if (matched.type === "FIXED" && matched.minAmount && basePrice < matched.minAmount) {
			Alert.alert("Mã khuyến mại", `Chưa đạt đơn tối thiểu ${formatPrice(matched.minAmount)}`);
			return;
		}

		setSelectedPromo(matched);
		Alert.alert("Mã khuyến mại", `${matched.title} đã được áp dụng`);
	};

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

	// Calculate Final Summary Object
	const summary = useMemo(() => {
		const insuranceRate = vehicle ? getInsuranceRate((vehicle as any).type) : 0;
		const insuranceFee = insuranceSelected ? insuranceRate * durationDays : 0;
		const depositAmount = Number(vehicle?.depositAmount || 0);

		const totalPrice = basePrice + deliveryFee + insuranceFee - discountAmount;

		return {
			durationDays,
			basePrice,
			deliveryFee,
			discountAmount,
			insuranceFee,
			totalPrice,
			depositAmount,
		};
	}, [basePrice, deliveryFee, discountAmount, insuranceSelected, durationDays, vehicle, getInsuranceRate]);


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

		// Normalize dates
		const start = new Date(startDate);
		const end = new Date(endDate);

		if (start > end) {
			Alert.alert("Lỗi", "Ngày kết thúc không được trước ngày bắt đầu");
			return;
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (start < today) {
			Alert.alert("Lỗi", "Ngày bắt đầu không được trong quá khứ");
			return;
		}

		createRentalMutation.mutate({
			vehicleId,
			startDate: start.toISOString(),
			endDate: end.toISOString(),
			deliveryFee,
			discountAmount,
			insuranceFee: summary.insuranceFee,
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
							Năm {vehicle.year} • {vehicle.color} {vehicle.type ? `• ${vehicle.type}` : ""}
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
							mode="date"
							minimumDate={new Date()}
						/>

						<DatePicker
							label="Ngày kết thúc"
							value={endDate}
							onChange={(value) => setEndDate(value)}
							placeholder="Chọn ngày kết thúc"
							mode="date"
							minimumDate={startDate ? new Date(startDate) : new Date()}
						/>
						{/* Unavailability notice */}
						{vehicle?.unavailabilities && vehicle.unavailabilities.length > 0 && (
							<>
								<UnavailabilityNotice
									count={vehicle.unavailabilities.length}
									onPress={() => setUnavailModalVisible(true)}
								/>

								<UnavailabilityModal
									visible={unavailModalVisible}
									onClose={() => setUnavailModalVisible(false)}
									items={vehicle.unavailabilities}
								/>
							</>
						)}
					</View>

					{/* Delivery / Pickup options */}
					<View className="mb-4">
						<Text className="text-sm text-gray-600 mb-2">Hình thức nhận/giao xe</Text>
						{/* Pickup */}
						<TouchableOpacity
							onPress={() => { setDeliveryAddress(null); setDeliveryFee(0) }}
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
									<View className="flex-row justify-between">
										<Text className="font-semibold text-gray-900">
											{vehicle?.deliveryAvailable
												? "Tôi muốn được giao xe tận nơi"
												: "Chủ xe không hỗ trợ giao xe tận nơi"}
										</Text>
										{deliveryDistanceKm != null && deliveryAddress && (
											<View style={{ justifyContent: "center", marginLeft: 8 }}>
												<Text style={{ color: "#10B981", fontWeight: "700" }}>
													{deliveryDistanceKm.toFixed(1)} km
												</Text>
											</View>
										)}
									</View>
									{vehicle?.deliveryAvailable &&
										(deliveryAddress ? (
											<Text className="text-sm text-gray-700 mt-1" style={{ maxWidth: "85%" }}>
												{deliveryAddress.address || ""}
												{deliveryAddress.ward ? `, ${deliveryAddress.ward}` : ""}
												{deliveryAddress.district ? `, ${deliveryAddress.district}` : ""}
												{deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}
											</Text>
										) : (
											<Text className="text-sm text-gray-500 mt-1">Chọn địa điểm giao xe</Text>
										))}
									{vehicle?.deliveryAvailable && (
										<View className="flex-row justify-between">
											{vehicle.deliveryRadiusKm && (
												<Text
													className="text-sm text-gray-600 mt-1"
													style={{ color: COLORS.primary }}
												>
													• Giới hạn {vehicle.deliveryRadiusKm} km
												</Text>
											)}
											<Text
												className="text-sm text-gray-600 mt-1"
												style={{ color: COLORS.primary }}
											>
												• {formatPrice(deliveryFeePerKm || DELIVERY_FEE_PER_KM)}/km
											</Text>
										</View>
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
							if (!vehicle || vehicle.lat == null || vehicle.lng == null) {
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

							const radius = vehicle.deliveryRadiusKm ?? 0;
							if (radius > 0 && dist > radius) {
								Alert.alert("Lỗi", `Vượt giới hạn giao: ${dist.toFixed(1)} km (max ${radius} km)`);
								return;
							}

							const feePerKm = deliveryFeePerKm ?? DELIVERY_FEE_PER_KM;
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

					{/* Price Summary & Details */}
					{startDate && endDate && (
						<>
							{/* Insurance Block */}
							<View className="mb-4">
								<Text className="text-sm text-gray-600 mb-2">Bảo hiểm bổ sung</Text>
								<TouchableOpacity
									onPress={() => setInsuranceSelected(!insuranceSelected)}
									activeOpacity={0.8}
									className={`p-4 rounded-xl mb-2 flex-row items-start ${insuranceSelected ? "bg-white border border-gray-200" : "bg-gray-50 border border-gray-200"}`}
								>
									<View
										style={{
											width: 20,
											height: 20,
											borderRadius: 6,
											borderWidth: 1,
											borderColor: insuranceSelected ? COLORS.primary : "#D1D5DB",
											alignItems: "center",
											justifyContent: "center",
											backgroundColor: insuranceSelected ? COLORS.primary : "transparent",
										}}
									>
										{insuranceSelected && <MaterialIcons name="check" size={16} color="#fff" />}
									</View>
									<View className="ml-3 flex-1">
										<Text className="font-semibold text-gray-900">Bảo hiểm thuê xe</Text>
										<Text className="text-sm text-gray-700 mt-1">
											Bảo vệ hành khách & xe trong suốt chuyến. Chủ xe không hưởng phí này.
										</Text>
									</View>
									<View className="ml-3 items-end">
										<Text className="text-sm font-semibold text-green-900">
											{formatPrice(getInsuranceRate((vehicle as any)?.type || ""))}
											/ngày
										</Text>
										<TouchableOpacity onPress={() => setShowInsuranceInfo(true)} className="mt-6">
											<Text className="text-xs text-primary-600">Xem thêm &gt;</Text>
										</TouchableOpacity>
									</View>
								</TouchableOpacity>
							</View>

							<InsuranceInfoModal
								visible={showInsuranceInfo}
								onClose={() => setShowInsuranceInfo(false)}
							/>

							{/* Promo Selection */}
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
												// setDiscountAmount(0); // Không cần set nữa vì là derived
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

							{/* Total Summary */}
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
											Phí giao xe{" "}
											<Text style={{ color: "#9CA3AF" }}>
												({formatPrice(deliveryFeePerKm)} x {deliveryDistanceKm?.toFixed(1)} km)
											</Text>
										</Text>
										<Text className="text-sm font-semibold text-gray-900">
											{formatPrice(summary.deliveryFee)}
										</Text>
									</View>
								)}

								{summary.insuranceFee > 0 && (
									<View className="flex-row justify-between mb-2">
										<Text className="text-sm text-gray-600">
											Phí bảo hiểm{" "}
											<Text style={{ color: "#9CA3AF" }}>
												({formatPrice(getInsuranceRate((vehicle as any)?.type || ""))}{" "}
												x {summary.durationDays} ngày)
											</Text>
										</Text>
										<Text className="text-sm font-semibold text-gray-900">
											{formatPrice(summary.insuranceFee)}
										</Text>
									</View>
								)}

								{/* Chỉ hiển thị dòng giảm giá nếu số tiền giảm > 0 */}
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
						className={`rounded-xl p-4 mb-4 ${!startDate || !endDate || createRentalMutation.isPending ? "bg-gray-300" : "bg-orange-600"
							}`}
						style={!startDate || !endDate ? {} : { backgroundColor: COLORS.primary }}
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