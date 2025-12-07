import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, TouchableOpacity, ScrollView, Image, Alert, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { useToast } from "@/lib/toast";
import { useRequirePhoneVerification } from "@/lib/auth";
import { GalleryButton } from "@/components/gallery/gallery-button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import CitySelector from "@/components/location/city-selector";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useVehicleForm } from "@/forms/vehicle.forms";
import { VehicleInput } from "@/schemas/vehicle.schema";
import { normalize } from "@/lib/utils";

export default function VehicleCreateScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ vehicleId?: string }>();
	const vehicleId = params.vehicleId;
	const isEditMode = !!vehicleId;
	const toast = useToast();
	const { requirePhoneVerification } = useRequirePhoneVerification({
		message: "Vui lòng xác minh số điện thoại để đăng xe cho thuê",
	});

	// All hooks must be called before any early returns
	const [existingImageIds, setExistingImageIds] = useState<Map<string, string>>(new Map()); // Map URL -> Image ID
	const queryClient = useQueryClient();

	// Initialize form
	const form = useVehicleForm();

	// Load vehicle data if editing
	const { data: vehicleData, isLoading: isLoadingVehicle } = useQuery({
		queryKey: ["vehicle", vehicleId],
		queryFn: () => vehiclesApi.getById(vehicleId!),
		enabled: isEditMode && !!vehicleId,
	});

	// Load vehicle types & cities
	const { data: vehicleTypes = [], isLoading: isLoadingTypes } = useQuery({
		queryKey: ["vehicle-types"],
		queryFn: () => vehiclesApi.getTypes(),
	});
	const { data: cities = [] } = useQuery({
		queryKey: ["cities"],
		queryFn: () => vehiclesApi.getCities(),
	});

	// ensure default vehicleTypeId when creating
	useEffect(() => {
		if (!isEditMode && vehicleTypes.length > 0) {
			const cur = form.getValues("vehicleTypeId");
			if (!cur) form.setValue("vehicleTypeId", vehicleTypes[0].id);
		}
	}, [vehicleTypes, isEditMode, form]);

	// Location modal state & helpers
	const [showLocationModal, setShowLocationModal] = useState(false);
	const handleLocationSave = (addr: string, cityId?: string) => {
		form.setValue("location", addr, { shouldValidate: true });
		if (cityId) form.setValue("cityId", cityId, { shouldValidate: true });
		setShowLocationModal(false);
	};

	// Add registration docs handling
	// const handleSelectRegistrationDocs = (urls: string[]) => {
	// 	form.setValue("registrationDocs", urls, { shouldValidate: true });
	// };

	// Pre-fill form when vehicle data is loaded
	useEffect(() => {
		if (vehicleData) {
			const imageUrls =
				vehicleData.images && vehicleData.images.length > 0 ? vehicleData.images.map((img) => img.url) : [];

			// Map URLs to image IDs for deletion
			const urlToIdMap = new Map<string, string>();
			if (vehicleData.images) {
				vehicleData.images.forEach((img) => {
					urlToIdMap.set(img.url, img.id);
				});
			}
			setExistingImageIds(urlToIdMap);

			form.reset({
				brand: vehicleData.brand || "",
				model: vehicleData.model || "",
				year: String(vehicleData.year || "2020"),
				color: vehicleData.color || "",
				licensePlate: vehicleData.licensePlate || "",
				dailyRate: String(vehicleData.dailyRate || "200000"),
				depositAmount: String(vehicleData.depositAmount || "1000000"),
				fuelType: (vehicleData.fuelType as VehicleInput["fuelType"]) || "PETROL",
				transmission: (vehicleData.transmission as VehicleInput["transmission"]) || "MANUAL",
				imageUrls,
				location: vehicleData.location ?? "",
				cityId: vehicleData.cityId ?? "",
				vehicleTypeId: vehicleData.vehicleTypeId ?? "",
			});
		}
	}, [vehicleData, form]);

	const createMutation = useMutation({
		mutationFn: async (data: VehicleInput) => {
			if (isEditMode && vehicleId) {
				// Update existing vehicle
				const vehicle = await vehiclesApi.update(vehicleId, {
					brand: data.brand,
					model: data.model,
					year: Number(data.year),
					color: data.color,
					licensePlate: data.licensePlate,
					dailyRate: Number(data.dailyRate),
					depositAmount: Number(data.depositAmount),
					fuelType: data.fuelType,
					transmission: data.transmission,
					vehicleTypeId: data.vehicleTypeId,
					location: data.location,
					cityId: data.cityId,
				});

				// Handle images: add new ones and remove deleted ones
				const currentUrls = new Set(data.imageUrls);
				const existingUrls = new Set(Array.from(existingImageIds.keys()));
				// const currentUrls = new Set([...(data.imageUrls || []), ...(data.registrationDocs || [])]);

				// Remove images that are no longer in the list
				const urlsToRemove = Array.from(existingUrls).filter((url) => !currentUrls.has(url));
				for (const url of urlsToRemove) {
					const imageId = existingImageIds.get(url);
					if (imageId) {
						try {
							await vehiclesApi.removeImage(vehicleId, imageId);
						} catch (error) {
							console.error("Error removing image:", error);
						}
					}
				}

				// Add new images
				const urlsToAdd = data.imageUrls.filter((url) => !existingUrls.has(url));
				if (urlsToAdd.length > 0) {
					try {
						await Promise.all(urlsToAdd.map((url) => vehiclesApi.addImage(vehicleId, url)));
					} catch (imageError: any) {
						console.error("Error adding images:", imageError);
						toast.showError(imageError?.message || "Cập nhật xe nhưng thêm hình ảnh thất bại", {
							title: "Cảnh báo",
						});
					}
				}

				return vehicle;
			} else {
				// Create new vehicle
				const vehicle = await vehiclesApi.create({
					brand: data.brand,
					model: data.model,
					year: Number(data.year),
					color: data.color,
					licensePlate: data.licensePlate,
					dailyRate: Number(data.dailyRate),
					depositAmount: Number(data.depositAmount),
					fuelType: data.fuelType,
					transmission: data.transmission,
					vehicleTypeId: data.vehicleTypeId,
					location: data.location,
					cityId: data.cityId,
				});

				// Thêm hình ảnh nếu có
				if (data.imageUrls.length > 0) {
					try {
						await Promise.all(data.imageUrls.map((url) => vehiclesApi.addImage(vehicle.id, url)));
					} catch (imageError: any) {
						console.error("Error adding images:", imageError);
						toast.showError(imageError?.message || "Đã tạo xe nhưng thêm hình ảnh thất bại", {
							title: "Cảnh báo",
						});
					}
				}

				return vehicle;
			}
		},
		onSuccess: () => {
			toast.showSuccess(isEditMode ? "Đã cập nhật xe" : "Đã tạo xe (DRAFT)", {
				title: "Thành công",
			});
			queryClient.invalidateQueries({ queryKey: ["vehicles"] });
			queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
			if (vehicleId) {
				queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
			}
			router.back();
		},
		onError: (e: any) => {
			// Parse error message from API response
			const errorMessage =
				e?.response?.data?.message || e?.message || (isEditMode ? "Cập nhật xe thất bại" : "Tạo xe thất bại");

			// Check for duplicate license plate error
			if (errorMessage.includes("biển số") || errorMessage.includes("licensePlate")) {
				toast.showError(errorMessage, { title: "Biển số đã tồn tại" });
			} else {
				toast.showError(errorMessage, { title: "Lỗi" });
			}
		},
	});

	const handleSelectImages = async (urls: string[]) => {
		form.setValue("imageUrls", urls, { shouldValidate: true });
	};

	const handleRemoveImage = (index: number) => {
		Alert.alert("Xóa hình ảnh", "Bạn có chắc muốn xóa hình ảnh này?", [
			{ text: "Hủy", style: "cancel" },
			{
				text: "Xóa",
				style: "destructive",
				onPress: () => {
					const currentImages = form.getValues("imageUrls");
					form.setValue(
						"imageUrls",
						currentImages.filter((_, i) => i !== index),
						{ shouldValidate: true }
					);
				},
			},
		]);
	};

	const handleSelectDocs = (urls: string[]) => {
		const prefixed = urls.map((u) => u + "?type=doc"); // thêm query flag
		const current = form.getValues("imageUrls") || [];
		// Gộp thêm ảnh giấy tờ vào imageUrls
		form.setValue("imageUrls", [...current, ...prefixed], { shouldValidate: true });
	};

	const handleRemoveDoc = (urlToRemove: string) => {
		Alert.alert("Xóa hình giấy tờ", "Bạn chắc chắn muốn xóa ảnh này?", [
			{ text: "Hủy", style: "cancel" },
			{
				text: "Xóa",
				style: "destructive",
				onPress: () => {
					const updated = form.getValues("imageUrls").filter((url: string) => url !== urlToRemove);
					form.setValue("imageUrls", updated, { shouldValidate: true });
				},
			},
		]);
	};

	const onSubmit = (data: VehicleInput) => {
		createMutation.mutate(data);
	};

	// Check phone verification after all hooks
	// if (!requirePhoneVerification()) {
	//   return null; // Đã redirect
	// }

	if (isLoadingVehicle) {
		return (
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<View className="flex-1 items-center justify-center">
					<Text className="text-gray-600">Đang tải thông tin xe...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
			<ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
				<View className="flex-row items-center mb-6 pt-4">
					<TouchableOpacity onPress={() => router.back()} className="mr-3">
						<Text className="text-base text-gray-900">
							<MaterialIcons name="arrow-back" size={24} color="#000" />
						</Text>
					</TouchableOpacity>
					<Text className="text-2xl font-bold text-gray-900">
						{isEditMode ? "Chỉnh sửa xe" : "Đăng xe mới"}
					</Text>
				</View>
				<View className="gap-4">
					{/* Brand */}
					<Controller
						control={form.control}
						name="brand"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Hãng *</Text>
								<Input
									placeholder="Hãng *"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Model */}
					<Controller
						control={form.control}
						name="model"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Dòng xe *</Text>
								<Input
									placeholder="Dòng xe *"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Year */}
					<Controller
						control={form.control}
						name="year"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Năm *</Text>
								<Input
									placeholder="Năm *"
									keyboardType="numeric"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Color */}
					<Controller
						control={form.control}
						name="color"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Màu *</Text>
								<Input
									placeholder="Màu *"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* License Plate */}
					<Controller
						control={form.control}
						name="licensePlate"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Biển số *</Text>
								<Input
									placeholder="Biển số *"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Fuel Type */}
					<Controller
						control={form.control}
						name="fuelType"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<View>
								<Select
									label="Nhiên liệu"
									placeholder="Chọn loại nhiên liệu"
									value={value}
									onValueChange={onChange}
									options={[
										{ label: "Xăng", value: "PETROL" },
										{ label: "Điện", value: "ELECTRIC" },
										{ label: "Hybrid", value: "HYBRID" },
									]}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Transmission */}
					<Controller
						control={form.control}
						name="transmission"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<View>
								<Select
									label="Hộp số"
									placeholder="Chọn loại hộp số"
									value={value}
									onValueChange={onChange}
									options={[
										{ label: "Số sàn", value: "MANUAL" },
										{ label: "Số tự động", value: "AUTOMATIC" },
										{ label: "Bán tự động", value: "SEMI_AUTOMATIC" },
									]}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Daily Rate */}
					<Controller
						control={form.control}
						name="dailyRate"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Giá ngày (đ) *</Text>
								<Input
									placeholder="Giá ngày (đ) *"
									keyboardType="numeric"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Deposit Amount */}
					<Controller
						control={form.control}
						name="depositAmount"
						render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
							<View>
								<Text className="text-sm font-medium text-gray-700 mb-2">Tiền cọc (đ) *</Text>
								<Input
									placeholder="Tiền cọc (đ) *"
									keyboardType="numeric"
									className={`border rounded-lg px-4 py-3 ${
										error ? "border-red-500" : "border-gray-300"
									}`}
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Loại xe (VehicleType) */}
					<Controller
						control={form.control}
						name="vehicleTypeId"
						render={({ field: { onChange, value }, fieldState: { error } }) => (
							<View className="mt-4">
								<Select
									label="Loại xe"
									placeholder="Chọn loại xe"
									value={value}
									onValueChange={onChange}
									options={
										vehicleTypes && vehicleTypes.length > 0
											? vehicleTypes.map((t: any) => ({
													label: t.description || t.name,
													value: t.id,
											  }))
											: [
													{ label: "Tay ga", value: "tay-ga" },
													{ label: "Xe số", value: "xe-so" },
													{ label: "Xe điện", value: "xe-dien" },
													{ label: "Tay côn", value: "tay-con" },
													{ label: "50 cc", value: "50cc" },
											  ]
									}
								/>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>

					{/* Địa chỉ thuê xe (modal) */}
					<Controller
						control={form.control}
						name="location"
						render={({ field: { value } }) => (
							<View className="mt-4">
								<Text className="text-sm font-medium text-gray-700 mb-2">Địa chỉ thuê xe *</Text>
								<TouchableOpacity
									onPress={() => setShowLocationModal(true)}
									className={`border rounded-lg px-4 py-3 ${value ? "bg-white" : "bg-white"}`}
								>
									<Text className={`${value ? "text-gray-900" : "text-gray-400"}`}>
										{value || "Chọn địa chỉ thuê xe"}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					/>

					{/* Modal chọn địa chỉ */}
					<Modal
						visible={showLocationModal}
						transparent
						animationType="slide"
						onRequestClose={() => setShowLocationModal(false)}
					>
						<View className="bg-black/50" style={{ flex: 1, justifyContent: "flex-end" }}>
							<View
								style={{
									backgroundColor: "#fff",
									borderTopLeftRadius: 12,
									borderTopRightRadius: 12,
									padding: 20,
									minHeight: "88%",
								}}
							>
								<Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 8 }}>Nhập địa chỉ *</Text>
								<Input
									placeholder="Nhập địa chỉ (ví dụ: 123 Đường A, Quận B)"
									onChangeText={(t) => form.setValue("__tmp_location_input", t)}
									defaultValue={form.getValues("__tmp_location_input") || ""}
									style={{
										borderWidth: 1,
										borderColor: "#E5E7EB",
										borderRadius: 8,
										padding: 10,
										marginBottom: 12,
									}}
								/>
								<Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 8 }}>
									Chọn thành phố *
								</Text>
								{/* City selector (extracted to reusable component) */}
								<View>
									{/* Replace inline city list with reusable component */}
									{}
									{/* @ts-ignore */}
									<CitySelector
										cities={cities}
										selectedCityId={(() => {
											const tmpCity = form.watch("__tmp_city");
											try {
												return tmpCity ? JSON.parse(tmpCity).id : undefined;
											} catch {
												return undefined;
											}
										})()}
										onSelect={(c: any) =>
											form.setValue(
												"__tmp_city",
												JSON.stringify({ id: c.id, name: c.name, province: c.province })
											)
										}
									/>
								</View>
								<View
									style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 18, gap: 16 }}
								>
									<TouchableOpacity
										onPress={() => setShowLocationModal(false)}
										style={{ marginRight: 16 }}
									>
										<Text style={{ color: "#6B7280" }}>Hủy</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => {
											const addr = form.getValues("__tmp_location_input") || "";
											const tmpCity = form.getValues("__tmp_city");
											const parsed = tmpCity ? JSON.parse(tmpCity) : undefined;
											if (!addr || !parsed) {
												toast.showError("Vui lòng nhập địa chỉ và chọn thành phố", {
													title: "Thiếu",
												});
												return;
											}
											handleLocationSave(addr + ", " + parsed.name, parsed.id);
										}}
									>
										<Text style={{ color: "#EA580C", fontWeight: "600" }}>Lưu</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</Modal>
				</View>

				{/* Hình ảnh xe */}
				<Controller
					control={form.control}
					name="imageUrls"
					render={({ field: { value }, fieldState: { error } }) => {
						const vehicleImages = value.filter((u: string) => !u.includes("type=doc"));
						return (
							<View className="mt-4">
								<Text className="text-base font-semibold text-gray-900 mb-3">
									Hình ảnh xe {vehicleImages.length > 0 && `(${vehicleImages.length})`}
								</Text>
								<Text className="text-sm text-gray-600 mb-3">* Chọn ít nhất 1 ảnh</Text>

								{/* Gallery Button */}
								<GalleryButton
									onSelect={handleSelectImages}
									folder="vehicles"
									multiple={true}
									maxSelections={10}
									label="Chọn hình ảnh từ thư viện"
									variant="outline"
								/>

								{/* Hiển thị hình ảnh đã chọn */}
								{vehicleImages.length > 0 && (
									<View className="mt-4">
										<View className="flex-row flex-wrap gap-3">
											{vehicleImages.map((url, index) => (
												<View key={index} className="relative">
													<Image
														source={{ uri: url }}
														className="w-24 h-24 rounded-lg"
														resizeMode="cover"
													/>
													<TouchableOpacity
														onPress={() => handleRemoveDoc(url)}
														className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
													>
														<MaterialIcons name="close" size={16} color="#fff" />
													</TouchableOpacity>
												</View>
											))}
										</View>
									</View>
								)}

								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						);
					}}
				/>

				{/* Hình ảnh giấy tờ xe */}
				<Controller
					control={form.control}
					name="imageUrls"
					render={({ field: { value }, fieldState: { error } }) => {
						const docImages = value.filter((u: string) => u.includes("type=doc"));
						return (
							<View className="mt-6">
								<Text className="text-base font-semibold text-gray-900 mb-3">
									Hình ảnh giấy tờ xe {docImages.length > 0 && `(${docImages.length})`}
								</Text>
								<Text className="text-sm text-gray-600 mb-3">
									* Ảnh cà vẹt / giấy đăng ký xe (tối đa 5 tấm)
								</Text>

								{/* nút chọn ảnh giấy tờ */}
								<GalleryButton
									onSelect={handleSelectDocs}
									folder="vehicle-docs"
									multiple={true}
									maxSelections={5}
									label="Chọn ảnh giấy tờ"
									variant="outline"
								/>

								{/* Hiển thị nhóm ảnh giấy tờ (lọc từ imageUrls) */}
								<View className="mt-4">
									<View className="flex-row flex-wrap gap-3">
										{docImages
											.filter((u) => u.includes("doc")) // ảnh có prefix "doc"
											.map((url, index) => (
												<View key={index} className="relative">
													<Image
														source={{ uri: url }}
														className="w-24 h-24 rounded-lg"
														resizeMode="cover"
													/>
													<TouchableOpacity
														onPress={() => handleRemoveDoc(url)}
														className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
													>
														<MaterialIcons name="close" size={16} color="#fff" />
													</TouchableOpacity>
												</View>
											))}
									</View>
								</View>

								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						);
					}}
				/>

				<TouchableOpacity
					className="mt-6 bg-orange-600 rounded-lg px-4 py-3 items-center disabled:opacity-50"
					onPress={form.handleSubmit(onSubmit)}
					disabled={createMutation.isPending}
				>
					<Text className="text-white font-semibold">
						{createMutation.isPending
							? isEditMode
								? "Đang cập nhật..."
								: "Đang tạo..."
							: isEditMode
							? "Cập nhật xe"
							: "Tạo xe"}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
}
