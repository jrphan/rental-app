import { Controller } from "react-hook-form";
import { ActivityIndicator, Text, View, ScrollView, Switch, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GalleryField from "@/components/gallery/GalleryField";
import LocationPicker from "@/components/location/LocationPicker";
import { useVehicleForm } from "@/hooks/forms/vehicle.forms";
import { apiVehicle } from "@/services/api.vehicle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { router } from "expo-router";
import { apiUser } from "@/services/api.user";
import { useState, useEffect } from "react";
import { COLORS } from "@/constants/colors";
import { VEHICLE_BRANDS, VEHICLE_TYPES, getModelsByBrand, getVehicleTypeByModel } from "@/constants/vehicle.constants";
import { VIETNAM_CITIES } from "@/constants/city.constants";
import type { VehicleInput } from "@/schemas/vehicle.schema";
import { formatCurrency, parseCurrency } from "@/utils/currency";

const licenseTypeOptions = [
	{ label: "A1", value: "A1" },
	{ label: "A2", value: "A2" },
	{ label: "A3", value: "A3" },
	{ label: "A4", value: "A4" },
];

interface VehicleFormProps {
	vehicleId?: string;
}

export default function VehicleForm({ vehicleId }: VehicleFormProps) {
	const { user, updateUser } = useAuthStore();
	const queryClient = useQueryClient();
	const form = useVehicleForm();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load vehicle data if vehicleId is provided
	const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
		queryKey: ["myVehicle", vehicleId],
		queryFn: () => apiVehicle.getMyVehicleDetail(vehicleId!),
		enabled: !!vehicleId,
	});

	// Populate form with vehicle data when loaded
	useEffect(() => {
		if (vehicleData) {
			const imageUrls = vehicleData.images.sort((a, b) => a.order - b.order).map((img) => img.url);

			form.reset({
				type: vehicleData.type,
				brand: vehicleData.brand,
				model: vehicleData.model,
				year: vehicleData.year.toString(),
				color: vehicleData.color,
				licensePlate: vehicleData.licensePlate,
				engineSize: vehicleData.engineSize.toString(),
				requiredLicense: vehicleData.requiredLicense as "A1" | "A2" | "A3" | "A4",
				fullAddress: vehicleData.fullAddress,
				address: vehicleData.address,
				ward: vehicleData.ward || "",
				district: vehicleData.district || "",
				city: vehicleData.city || "",
				lat: vehicleData.lat.toString(),
				lng: vehicleData.lng.toString(),
				pricePerDay: vehicleData.pricePerDay.toString(),
				depositAmount: vehicleData.depositAmount.toString(),
				description: vehicleData.description || "",
				cavetFront: (vehicleData as any).cavetFront || "",
				cavetBack: (vehicleData as any).cavetBack || "",
				instantBook: vehicleData.instantBook || false,
				deliveryAvailable: (vehicleData as any).deliveryAvailable || false,
				deliveryBaseFee: (vehicleData as any).deliveryBaseFee?.toString() ?? "0",
				deliveryFeePerKm: (vehicleData as any).deliveryFeePerKm?.toString() ?? "10000",
				deliveryRadiusKm: (vehicleData as any).deliveryRadiusKm?.toString() || "",
				imageUrls: imageUrls.length > 0 ? imageUrls : [],
			});
		}
	}, [vehicleData, form]);

	// Auto-fill vehicle type when brand and model are selected
	const selectedBrand = form.watch("brand");
	const selectedModel = form.watch("model");

	useEffect(() => {
		if (selectedBrand && selectedModel && selectedBrand !== "Khác") {
			const vehicleType = getVehicleTypeByModel(selectedModel);
			if (vehicleType) {
				form.setValue("type", vehicleType);
			}
		}
	}, [selectedBrand, selectedModel, form]);

	const mutation = useMutation({
		mutationFn: async (data: VehicleInput) => {
			// Transform form data to API format
			const images = data.imageUrls.map((url, index) => ({
				url,
				isPrimary: index === 0,
				order: index,
			}));

			const vehiclePayload = {
				type: data.type,
				brand: data.brand,
				model: data.model,
				year: parseInt(data.year, 10),
				color: data.color,
				licensePlate: data.licensePlate,
				engineSize: parseInt(data.engineSize, 10),
				requiredLicense: data.requiredLicense,
				fullAddress: data.fullAddress,
				address: data.address,
				ward: data.ward,
				district: data.district,
				city: data.city,
				lat: parseFloat(data.lat),
				lng: parseFloat(data.lng),
				pricePerDay: parseInt(data.pricePerDay, 10),
				depositAmount: parseInt(data.depositAmount, 10),
				description: data.description,
				cavetFront: data.cavetFront,
				cavetBack: data.cavetBack,
				instantBook: data.instantBook,
				deliveryAvailable: data.deliveryAvailable,
				// system default: fee per km = 10,000 VND if owner doesn't supply
				deliveryBaseFee: data.deliveryBaseFee ? parseInt(data.deliveryBaseFee, 10) : 0,
				deliveryFeePerKm: data.deliveryFeePerKm ? parseFloat(data.deliveryFeePerKm) : 10000,
				deliveryRadiusKm: data.deliveryRadiusKm ? parseInt(data.deliveryRadiusKm, 10) : null,
				images,
			};

			// If vehicle exists, update it
			if (vehicleId && vehicleData) {
				// Update vehicle
				const updateResult = await apiVehicle.updateVehicle(vehicleId, vehiclePayload);

				// If status is REJECTED or DRAFT, change to PENDING after update
				// If status is APPROVED, keep it as APPROVED (don't change status)
				if (vehicleData.status === "REJECTED" || vehicleData.status === "DRAFT") {
					await apiVehicle.updateVehicleStatus(vehicleId, {
						status: "PENDING",
					});
				}

				return updateResult;
			}

			// Otherwise, create new vehicle
			return apiVehicle.create(vehiclePayload);
		},
		onSuccess: async () => {
			// Refresh user info to get updated isVendor status
			try {
				const updatedUser = await apiUser.getUserInfo();
				updateUser(updatedUser);
				queryClient.invalidateQueries({ queryKey: ["user", "sync"] });
				queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
				queryClient.invalidateQueries({ queryKey: ["myVehicle", vehicleId] });
			} catch (error) {
				console.error("Failed to sync user info:", error);
			}

			// Chuyển về danh sách xe sau khi cập nhật/tạo thành công
			router.replace("/(tabs)/vehicles");
		},
	});

	const onSubmit = async (values: VehicleInput) => {
		setIsSubmitting(true);
		try {
			await mutation.mutateAsync(values);
		} catch (error) {
			console.error("Vehicle submission error:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Check if user is eligible
	const isEligible = user?.isActive && user?.isPhoneVerified && user?.kyc?.status === "APPROVED";

	if (!isEligible) {
		const conditions = [
			{
				label: "Tài khoản đã được kích hoạt",
				completed: user?.isActive || false,
			},
			{
				label: "Đã xác thực số điện thoại",
				completed: user?.isPhoneVerified || false,
			},
			{
				label: "Đã hoàn thành KYC và được duyệt",
				completed: user?.kyc?.status === "APPROVED",
			},
		];

		return (
			<View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
				<Text className="text-base font-semibold text-red-900 mb-2">
					Bạn chưa đủ điều kiện đăng ký làm chủ xe
				</Text>
				<Text className="text-sm text-red-700 mb-2">Để đăng ký làm chủ xe, bạn cần:</Text>
				{conditions.map((condition, index) => (
					<View key={index} className="flex-row items-center mb-1">
						{condition.completed ? (
							<MaterialIcons name="check-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
						) : (
							<MaterialIcons
								name="radio-button-unchecked"
								size={18}
								color="#ef4444"
								style={{ marginRight: 8 }}
							/>
						)}
						<Text className={`text-sm ${condition.completed ? "text-green-700" : "text-red-700"}`}>
							{condition.label}
						</Text>
					</View>
				))}
			</View>
		);
	}

	if (isLoadingVehicle) {
		return (
			<View className="flex-1 items-center justify-center py-8">
				<ActivityIndicator size="large" color={COLORS.primary} />
				<Text className="mt-4 text-sm text-gray-600">Đang tải thông tin xe...</Text>
			</View>
		);
	}

	// Allow edit when REJECTED or DRAFT, disable when PENDING
	const isReadOnly = vehicleData?.status === "PENDING";

	// add same normalizer here to map returned city to select list value
	const normalizeCityName = (s?: string) =>
		(s || "")
			.replace(/^Thành phố\s+/i, "")
			.replace(/^TP[\.\s]+/i, "")
			.replace(/^Tỉnh\s+/i, "")
			.replace(/^Thị xã\s+/i, "")
			.trim();

	// When using LocationPicker, accept optional address parts and fill fields
	const handleLocationSelect = (
		lat: string,
		lng: string,
		addressParts?: {
			fullAddress?: string;
			address?: string;
			ward?: string;
			district?: string;
			city?: string;
		}
	) => {
		form.setValue("lat", lat, { shouldValidate: true });
		form.setValue("lng", lng, { shouldValidate: true });
		if (addressParts) {
			if (addressParts.fullAddress) form.setValue("fullAddress", addressParts.fullAddress);
			if (addressParts.address) form.setValue("address", addressParts.address);
			if (addressParts.ward) form.setValue("ward", addressParts.ward);
			if (addressParts.district) form.setValue("district", addressParts.district);
			if (addressParts.city) {
				// normalize city to match VIETNAM_CITIES values (e.g. "Hồ Chí Minh")
				const normalized = normalizeCityName(addressParts.city);
				form.setValue("city", normalized);
			}
		}
	};

	return (
		<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
			{vehicleData && vehicleData.status === "PENDING" && (
				<View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
					<Text className="text-sm font-medium text-amber-900 mb-1">
						Đang xem thông tin đăng ký xe đang chờ duyệt
					</Text>
					<Text className="text-xs text-amber-700">
						Xe: {vehicleData.brand} {vehicleData.model} - {vehicleData.licensePlate}
					</Text>
					<Text className="text-xs text-amber-700 mt-1">
						Bạn chỉ có thể xem thông tin. Không thể chỉnh sửa khi đang chờ duyệt.
					</Text>
				</View>
			)}

			{vehicleData && vehicleData.status === "REJECTED" && (
				<View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
					<Text className="text-sm font-medium text-red-900 mb-1">Đăng ký xe đã bị từ chối</Text>
					<Text className="text-xs text-red-700">
						Xe: {vehicleData.brand} {vehicleData.model} - {vehicleData.licensePlate}
					</Text>
					<Text className="text-xs text-red-700 mt-1">
						Vui lòng kiểm tra lại thông tin, cập nhật và gửi lại để được duyệt.
					</Text>
				</View>
			)}

			{vehicleData && vehicleData.status === "APPROVED" && (
				<View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
					<Text className="text-sm font-medium text-green-900 mb-1">Xe đã được duyệt</Text>
					<Text className="text-xs text-green-700">
						Xe: {vehicleData.brand} {vehicleData.model} - {vehicleData.licensePlate}
					</Text>
					<Text className="text-xs text-green-700 mt-1">
						Bạn có thể cập nhật thông tin xe. Xe sẽ vẫn ở trạng thái đã duyệt sau khi cập nhật.
					</Text>
				</View>
			)}

			<Text className="text-base text-gray-600 mb-4">
				{vehicleData
					? "Thông tin xe đã đăng ký. Bạn có thể xem lại thông tin đã gửi."
					: "Vui lòng cung cấp thông tin về xe của bạn để đăng ký làm chủ xe."}
			</Text>

			<Controller
				control={form.control}
				name="brand"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<Select
							label="Hãng xe *"
							options={VEHICLE_BRANDS}
							value={value}
							onValueChange={(newValue) => {
								onChange(newValue);
								// Reset model when brand changes
								form.setValue("model", "");
							}}
							placeholder="Chọn hãng xe"
							disabled={isReadOnly}
							renderItem={(item: any) => (
								<View className="flex-row items-center">
									{item.icon && (
										<Image
											source={{ uri: item.icon }}
											style={{ width: 24, height: 24, marginRight: 8 }}
											resizeMode="contain"
										/>
									)}
									<Text className="text-base text-gray-900">{item.label}</Text>
								</View>
							)}
						/>
						{error && <Text className="mt-1 text-sm text-red-500">{error.message}</Text>}
					</View>
				)}
			/>

			<Controller
				control={form.control}
				name="model"
				render={({ field: { onChange, value }, fieldState: { error } }) => {
					// const selectedBrand = form.watch("brand"); // Đã lấy ở trên
					const modelOptions = selectedBrand ? getModelsByBrand(selectedBrand) : [];

					// If brand is "Khác" or not selected, show input field
					if (selectedBrand === "Khác" || !selectedBrand) {
						return (
							<Input
								label="Dòng xe *"
								placeholder={selectedBrand === "Khác" ? "Nhập tên dòng xe" : "Chọn hãng xe trước"}
								value={value}
								onChangeText={onChange}
								error={error?.message}
								editable={!isReadOnly && selectedBrand === "Khác"}
							/>
						);
					}

					return (
						<View className="mb-4">
							<Select
								label="Dòng xe *"
								options={modelOptions}
								value={value}
								onValueChange={onChange}
								placeholder="Chọn dòng xe"
								disabled={isReadOnly || !selectedBrand || modelOptions.length === 0}
							/>
							{error && <Text className="mt-1 text-sm text-red-500">{error.message}</Text>}
						</View>
					);
				}}
			/>

			<Controller
				control={form.control}
				name="type"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<Select
							label="Loại xe *"
							options={VEHICLE_TYPES}
							value={value}
							onValueChange={onChange}
							placeholder="Chọn loại xe"
							disabled={isReadOnly}
						/>
						{error && <Text className="mt-1 text-sm text-red-500">{error.message}</Text>}
					</View>
				)}
			/>

			<Controller
				control={form.control}
				name="year"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Năm sản xuất *"
						placeholder="Ví dụ: 2020"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						keyboardType="numeric"
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="color"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Màu sắc *"
						placeholder="Ví dụ: Đỏ, Xanh, Trắng"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="licensePlate"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Biển số xe *"
						placeholder="Ví dụ: 51A-12345"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						autoCapitalize="characters"
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="engineSize"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Dung tích xi lanh (cc) *"
						placeholder="Ví dụ: 110, 125, 150"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						keyboardType="numeric"
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="requiredLicense"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<Select
							label="Loại bằng lái yêu cầu *"
							options={licenseTypeOptions}
							value={value}
							onValueChange={onChange}
							placeholder="Chọn loại bằng lái"
							disabled={isReadOnly}
						/>
						{error && <Text className="mt-1 text-sm text-red-500">{error.message}</Text>}
					</View>
				)}
			/>

			{/* Location Picker with GPS */}
			{!isReadOnly && (
				<View className="mb-2">
					<LocationPicker
						currentLat={form.watch("lat")}
						currentLng={form.watch("lng")}
						onLocationSelect={handleLocationSelect}
					/>
				</View>
			)}

			{/* Manual input fields */}
			<View className="flex-row gap-3 mb-4">
				<View className="flex-1">
					<Controller
						control={form.control}
						name="lat"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<Input
								label="Vĩ độ (Latitude) *"
								placeholder="10.762622"
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								error={error?.message}
								keyboardType="numeric"
								editable={!isReadOnly}
							/>
						)}
					/>
				</View>
				<View className="flex-1">
					<Controller
						control={form.control}
						name="lng"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<Input
								label="Kinh độ (Longitude) *"
								placeholder="106.660172"
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								error={error?.message}
								keyboardType="numeric"
								editable={!isReadOnly}
							/>
						)}
					/>
				</View>
			</View>

			<Controller
				control={form.control}
				name="address"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Địa chỉ *"
						placeholder="Nhập địa chỉ chi tiết"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						multiline
						numberOfLines={2}
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="ward"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Xã/Phường/Thị trấn"
						placeholder="Nhập xã/phường/thị trấn"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="district"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Quận/Huyện"
						placeholder="Nhập quận/huyện"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="city"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<Select
							label="Thành phố/Tỉnh"
							options={VIETNAM_CITIES}
							value={value}
							onValueChange={onChange}
							placeholder="Chọn thành phố/tỉnh"
							disabled={isReadOnly}
						/>
						{error && <Text className="mt-1 text-sm text-red-500">{error.message}</Text>}
					</View>
				)}
			/>

			<Controller
				control={form.control}
				name="pricePerDay"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Giá thuê theo ngày (VNĐ) *"
						placeholder="200.000"
						value={formatCurrency(value)}
						onChangeText={(text) => {
							const numericValue = parseCurrency(text);
							onChange(numericValue);
						}}
						onBlur={onBlur}
						error={error?.message}
						keyboardType="numeric"
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="depositAmount"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Input
						label="Tiền cọc (VNĐ) *"
						placeholder="1.000.000"
						value={formatCurrency(value)}
						onChangeText={(text) => {
							const numericValue = parseCurrency(text);
							onChange(numericValue);
						}}
						onBlur={onBlur}
						error={error?.message}
						keyboardType="numeric"
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="description"
				render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
					<Textarea
						label="Mô tả"
						placeholder="Mô tả thêm về xe của bạn (ví dụ: tình trạng xe, đặc điểm nổi bật, lưu ý khi thuê...)"
						value={value}
						onChangeText={onChange}
						onBlur={onBlur}
						error={error?.message}
						rows={5}
						editable={!isReadOnly}
					/>
				)}
			/>

			<Controller
				control={form.control}
				name="instantBook"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<View className="flex-row items-center justify-between mb-2">
							<View className="flex-1 mr-4">
								<Text className="text-sm font-medium text-gray-700 mb-1">
									Đặt xe ngay (Instant Book)
								</Text>
								<Text className="text-xs text-gray-500">
									Bật tính năng này để khách hàng có thể đặt xe ngay mà không cần chờ bạn xác nhận.
									Booking sẽ được tự động xác nhận sau khi thanh toán.
								</Text>
							</View>
							<Switch
								trackColor={{ true: "#34D399", false: "#D1D5DB" }}
								thumbColor={value ? "#fff" : "#fff"}
								onValueChange={onChange}
								value={value}
								disabled={isReadOnly}
							/>
						</View>
					</View>
				)}
			/>

			<Controller
				control={form.control}
				name="deliveryAvailable"
				render={({ field: { onChange, value }, fieldState: { error } }) => (
					<View className="mb-4">
						<View className="flex-row items-center justify-between mb-2">
							<View className="flex-1 mr-4">
								<Text className="text-sm font-medium text-gray-700 mb-1">Giao xe tận nơi</Text>
								<Text className="text-xs text-gray-500">
									Bật nếu bạn muốn hỗ trợ giao/nhận xe tận nơi. Hệ thống mặc định phí giao:
									10.000đ/km. Bạn chỉ cần nhập Giới hạn khoảng cách (km).
								</Text>
							</View>
							<Switch
								trackColor={{ true: "#34D399", false: "#D1D5DB" }}
								thumbColor={value ? "#fff" : "#fff"}
								onValueChange={onChange}
								value={value}
								disabled={isReadOnly}
							/>
						</View>
					</View>
				)}
			/>

			{/* Delivery settings */}
			{!isReadOnly && form.watch("deliveryAvailable") && (
				<Controller
					control={form.control}
					name="deliveryRadiusKm"
					render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
						<Input
							label="Giới hạn khoảng cách giao (km) - để trống nếu không giới hạn"
							placeholder="20"
							value={value}
							onChangeText={onChange}
							onBlur={onBlur}
							keyboardType="numeric"
							editable={!isReadOnly}
						/>
					)}
				/>
			)}

			{!isReadOnly && (
				<>
					<Controller
						control={form.control}
						name="cavetFront"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<GalleryField
								label="Ảnh đăng ký xe (mặt trước)"
								folder="vehicle-cavet"
								multiple={false}
								value={value || ""}
								onChange={(url) => onChange(typeof url === "string" ? url : null)}
								error={error?.message}
							/>
						)}
					/>

					<Controller
						control={form.control}
						name="cavetBack"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<GalleryField
								label="Ảnh đăng ký xe (mặt sau)"
								folder="vehicle-cavet"
								multiple={false}
								value={value || ""}
								onChange={(url) => onChange(typeof url === "string" ? url : null)}
								error={error?.message}
							/>
						)}
					/>

					<Controller
						control={form.control}
						name="imageUrls"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<GalleryField
								label="Hình ảnh xe * (tối thiểu 1 ảnh, tối đa 10 ảnh)"
								folder="vehicle-images"
								multiple={true}
								value={value || []}
								onChange={(urls) => onChange(Array.isArray(urls) ? urls : urls ? [urls] : [])}
								error={error?.message}
							/>
						)}
					/>
				</>
			)}

			{isReadOnly && vehicleData && (
				<View className="mb-4">
					<Text className="text-sm font-medium text-gray-700 mb-2">Hình ảnh xe</Text>
					<View className="flex-row flex-wrap gap-2">
						{vehicleData.images.map((img) => (
							<Image key={img.id} source={{ uri: img.url }} className="w-20 h-20 rounded-lg" />
						))}
					</View>
				</View>
			)}

			{(!vehicleData ||
				vehicleData.status === "REJECTED" ||
				vehicleData.status === "DRAFT" ||
				vehicleData.status === "APPROVED") && (
				<Button
					onPress={form.handleSubmit(onSubmit)}
					disabled={isSubmitting || mutation.isPending || isReadOnly}
					className="mt-4"
				>
					{isSubmitting || mutation.isPending ? (
						<ActivityIndicator size="small" color="#fff" />
					) : vehicleData?.status === "REJECTED" ? (
						"Cập nhật và gửi lại"
					) : vehicleData?.status === "APPROVED" ? (
						"Cập nhật thông tin"
					) : vehicleData ? (
						"Cập nhật xe"
					) : (
						"Đăng ký xe"
					)}
				</Button>
			)}

			{vehicleData && vehicleData.status === "PENDING" && (
				<View className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
					<Text className="text-sm font-medium text-blue-900 text-center">
						Xe của bạn đang chờ được duyệt. Vui lòng đợi phản hồi từ quản trị viên.
					</Text>
				</View>
			)}

			{mutation.isError && (
				<View className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
					<Text className="text-sm text-red-700">
						{(mutation.error as Error)?.message || "Đăng ký xe thất bại"}
					</Text>
				</View>
			)}
		</ScrollView>
	);
}
