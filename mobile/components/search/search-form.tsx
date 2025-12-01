import { View, Text, TouchableOpacity, Platform, Modal, TextInput, ScrollView, Alert } from "react-native";
import { Input } from "@/components/ui/input";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { useSearchForm } from "@/forms/search.forms";
import { vehiclesApi } from "@/lib/api.vehicles";
import { normalize } from "@/lib/utils";
import type { GestureResponderEvent } from "react-native";

interface SearchFormProps {
	initialLocation?: string;
	initialStartDate?: Date;
	initialEndDate?: Date;
	// include optional cityId in callback
	onSearch?: (params: { location: string; startDate: Date; endDate: Date; cityId?: string }) => void;
}

export function SearchForm({
	initialLocation = "TP. Hồ Chí Minh",
	initialStartDate,
	initialEndDate,
	onSearch,
}: SearchFormProps) {
	const router = useRouter();
	const form = useSearchForm({
		location: initialLocation,
		startDate: initialStartDate,
		endDate: initialEndDate,
	});

	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showLocationPicker, setShowLocationPicker] = useState(false);
	const [recentSearches, setRecentSearches] = useState<
		{ label: string; cityId?: string; coords?: { lat: number; lng: number } }[]
	>([]);
	const [cities, setCities] = useState<any[]>([]);
	const [selectedCityId, setSelectedCityId] = useState<string | undefined>(undefined);
	const [suggestions, setSuggestions] = useState<any[]>([]);
	const debounceRef = useRef<number | null>(null);

	// load cities & recents
	useEffect(() => {
		(async () => {
			try {
				const c = await vehiclesApi.getCities();
				setCities(c || []);
			} catch (e) {
				// ignore
			}
			try {
				const s = await AsyncStorage.getItem("recent_locations");
				if (s) setRecentSearches(JSON.parse(s));
			} catch {}
		})();
	}, []);

	// Autocomplete (Nominatim) - simple, no API key
	const fetchSuggestions = async (q: string) => {
		if (!q || q.trim().length < 2) {
			setSuggestions([]);
			return;
		}
		try {
			const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(
				q + ", Vietnam"
			)}`;
			const res = await fetch(url, { headers: { "User-Agent": "rent-app/1.0" } });
			const json = await res.json();
			setSuggestions(json || []);
		} catch {
			setSuggestions([]);
		}
	};

	// debounce text change
	const onLocationInputChange = (t: string) => {
		form.setValue("location", t);
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		// @ts-ignore
		debounceRef.current = setTimeout(() => fetchSuggestions(t), 300);
	};

	const saveRecent = async (entry: { label: string; cityId?: string; coords?: { lat: number; lng: number } }) => {
		try {
			const updated = [entry, ...recentSearches.filter((r) => r.label !== entry.label)].slice(0, 10);
			setRecentSearches(updated);
			await AsyncStorage.setItem("recent_locations", JSON.stringify(updated));
		} catch {}
	};

	// Sync with props changes
	useEffect(() => {
		if (initialLocation || initialStartDate || initialEndDate) {
			form.reset({
				location: initialLocation || "TP. Hồ Chí Minh",
				startDate: initialStartDate || new Date(),
				endDate: initialEndDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
			});
			// set default city from initialLocation if it matches a city name
			const matched = cities.find((c) => c.name === initialLocation);
			if (matched) setSelectedCityId(matched.id);
		}
	}, [initialLocation, initialStartDate, initialEndDate, form]);

	const formatDateTime = (date: Date) => {
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const year = date.getFullYear();
		return `${hours}h${minutes}, ${day}/${month}/${year}`;
	};

	const handleStartDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowStartDatePicker(false);
			if (event.type === "set" && selectedDate) {
				form.setValue("startDate", selectedDate, { shouldValidate: true });
			}
		} else {
			if (selectedDate) {
				form.setValue("startDate", selectedDate, { shouldValidate: true });
			}
		}
	};

	const handleEndDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === "android") {
			setShowEndDatePicker(false);
			if (event.type === "set" && selectedDate) {
				form.setValue("endDate", selectedDate, { shouldValidate: true });
			}
		} else {
			if (selectedDate) {
				form.setValue("endDate", selectedDate, { shouldValidate: true });
			}
		}
	};

	const handleUseCurrentLocation = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Quyền vị trí bị từ chối", "Vui lòng cho phép quyền vị trí để dùng tính năng này.");
				return;
			}
			const pos = await Location.getCurrentPositionAsync({});
			const rev = await Location.reverseGeocodeAsync({
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
			});
			const label =
				rev && rev.length > 0
					? `${rev[0].name || ""} ${rev[0].street || ""} ${rev[0].city || rev[0].region || ""}`.trim()
					: "Vị trí hiện tại";
			form.setValue("location", label, { shouldValidate: true });
			setSelectedCityId(
				rev[0]?.city ? cities.find((c) => normalize(c.name) === normalize(rev[0].city))?.id : undefined
			);
			await saveRecent({
				label,
				coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
				cityId: undefined,
			});
			setShowLocationPicker(false);
		} catch (e) {
			Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại");
		}
	};

	const handleSelectSuggestion = (s: any) => {
		const label = s.display_name || `${s.name || ""} ${s.address?.road || ""}`.trim();
		form.setValue("location", label, { shouldValidate: true });
		const cityName = s.address?.city || s.address?.town || s.address?.village || s.address?.state;
		if (cityName) {
			const matched = cities.find((c) => normalize(c.name) === normalize(cityName));
			if (matched) setSelectedCityId(matched.id);
		}
		saveRecent({ label, cityId: selectedCityId, coords: { lat: Number(s.lat), lng: Number(s.lon) } });
		setSuggestions([]);
		setShowLocationPicker(false);
	};

	// Update handleSearch to pass cityId to onSearch
	const handleSearch = (data: typeof form.formState.defaultValues) => {
		if (data?.location && data?.startDate && data?.endDate) {
			saveRecent({ label: data.location, cityId: selectedCityId });
			if (onSearch) {
				onSearch({
					location: data.location,
					startDate: data.startDate,
					endDate: data.endDate,
					cityId: selectedCityId,
				});
			} else {
				router.push({
					pathname: "/search",
					params: {
						location: data.location,
						startDate: data.startDate.toISOString(),
						endDate: data.endDate.toISOString(),
						cityId: selectedCityId,
					},
				});
			}
		}
	};

	// Render: use Input.rightIcon (now supported) and fix recent rows so delete button always visible
	return (
		<View className="bg-white rounded-3xl p-5 mx-4 mb-4 shadow-xl border border-gray-100">
			{/* Location Field */}
			<Controller
				control={form.control}
				name="location"
				render={({ field: { value }, fieldState: { error } }) => (
					<View>
						{/* Click opens modal; show current label */}
						<TouchableOpacity
							className={`mb-4 rounded-2xl p-4 border ${
								error ? "border-red-500 bg-red-50" : "bg-gray-50 border-gray-100"
							}`}
							onPress={() => setShowLocationPicker(true)}
							activeOpacity={0.7}
						>
							<View className="flex-row items-center mb-2">
								<View className="bg-primary-100 rounded-full p-2">
									<MaterialIcons name="location-on" size={20} color="#EA580C" />
								</View>
								<Text className="ml-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
									Địa điểm
								</Text>
							</View>
							<Text className="text-lg font-bold text-gray-900 mt-1">{value}</Text>
						</TouchableOpacity>
					</View>
				)}
			/>

			{/* Rental Time Field */}
			<View className="mb-5">
				<View className="flex-row items-center mb-3">
					<View className="bg-primary-100 rounded-full p-2">
						<MaterialIcons name="calendar-today" size={20} color="#EA580C" />
					</View>
					<Text className="ml-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
						Thời gian thuê
					</Text>
				</View>
				<View className="flex-row items-center gap-3">
					<Controller
						control={form.control}
						name="startDate"
						render={({ field: { value }, fieldState: { error } }) => (
							<View className="flex-1">
								<TouchableOpacity
									onPress={() => setShowStartDatePicker(true)}
									className={`rounded-xl p-3 border ${
										error ? "bg-red-50 border-red-500" : "bg-gray-50 border-gray-200"
									}`}
									activeOpacity={0.7}
								>
									<Text className="text-xs text-gray-500 mb-1">Từ</Text>
									<Text className="text-sm font-semibold text-gray-900">{formatDateTime(value)}</Text>
								</TouchableOpacity>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>
					<View className="bg-primary-100 rounded-full p-1.5">
						<MaterialIcons name="arrow-forward" size={16} color="#EA580C" />
					</View>
					<Controller
						control={form.control}
						name="endDate"
						render={({ field: { value }, fieldState: { error } }) => (
							<View className="flex-1">
								<TouchableOpacity
									onPress={() => setShowEndDatePicker(true)}
									className={`rounded-xl p-3 border ${
										error ? "bg-red-50 border-red-500" : "bg-gray-50 border-gray-200"
									}`}
									activeOpacity={0.7}
								>
									<Text className="text-xs text-gray-500 mb-1">Đến</Text>
									<Text className="text-sm font-semibold text-gray-900">{formatDateTime(value)}</Text>
								</TouchableOpacity>
								{error && <Text className="text-red-500 text-xs mt-1">{error.message}</Text>}
							</View>
						)}
					/>
				</View>
			</View>

			{/* Search Button */}
			<TouchableOpacity
				className="bg-primary-600 rounded-2xl py-4 items-center shadow-lg"
				onPress={form.handleSubmit(handleSearch)}
				activeOpacity={0.8}
				style={{
					shadowColor: "#EA580C",
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.3,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				<View className="flex-row items-center">
					<MaterialIcons name="search" size={24} color="#FFFFFF" />
					<Text className="text-white font-bold text-lg ml-2">Tìm xe</Text>
				</View>
			</TouchableOpacity>

			{/* Location Picker Modal */}
			<Modal
				visible={showLocationPicker}
				transparent
				animationType="slide"
				onRequestClose={() => setShowLocationPicker(false)}
			>
				<View className="flex-1 bg-black/60 items-center justify-end">
					{/* make modal taller (near-full) */}
					<View className="w-full bg-white rounded-t-3xl p-6 pb-8" style={{ minHeight: "86%" }}>
						<View className="flex-row items-center justify-between mb-6">
							<Text className="text-xl font-bold text-gray-900">Chọn địa điểm</Text>
							<TouchableOpacity
								onPress={() => setShowLocationPicker(false)}
								className="bg-gray-100 rounded-full p-2"
							>
								<MaterialIcons name="close" size={20} color="#6B7280" />
							</TouchableOpacity>
						</View>
						{/* Use existing Input component + clear icon */}
						<Input
							placeholder="Nhập địa điểm"
							value={form.watch("location")}
							onChangeText={onLocationInputChange}
							className="mb-2"
							viewClassName="rounded-xl border-gray-200"
							rightIcon={
								form.watch("location") ? (
									<TouchableOpacity
										onPress={() => {
											form.setValue("location", "");
											setSuggestions([]);
										}}
										accessibilityRole="button"
									>
										<MaterialIcons name="close" size={18} color="#6B7280" />
									</TouchableOpacity>
								) : undefined
							}
						/>

						{/* Suggestions list from Nominatim */}
						{suggestions.length > 0 && (
							<ScrollView className="mb-3" style={{ maxHeight: 180 }}>
								{suggestions.map((s, i) => (
									<TouchableOpacity
										key={i}
										onPress={() => handleSelectSuggestion(s)}
										className="py-3 border-b border-gray-100 flex-row items-start"
									>
										<MaterialIcons name="location-on" size={20} color="#EA580C" />
										<Text className="ml-3 text-base flex-1">{s.display_name}</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						)}

						{/* Quick: use current location */}
						<TouchableOpacity
							className="py-3 px-4 bg-gray-50 rounded-xl mb-9 border border-gray-200 flex-row items-center"
							onPress={handleUseCurrentLocation}
							activeOpacity={0.7}
						>
							<MaterialIcons name="my-location" size={20} color="#EA580C" />
							<Text className="ml-3 text-lg font-semibold text-gray-900">Vị trí hiện tại</Text>
						</TouchableOpacity>

						{/* List of cities (from API) */}
						<Text className="text-md text-gray-500 mb-3">Chọn thành phố</Text>
						<ScrollView style={{ maxHeight: 150 }} className="mb-3">
							{cities.length > 0 ? (
								cities.map((c: any) => {
									const isSelected = selectedCityId === c.id;
									return (
										<TouchableOpacity
											key={c.id}
											onPress={() => {
												form.setValue("location", `${c.name}`, { shouldValidate: true });
												setSelectedCityId(c.id);
												saveRecent({ label: c.name, cityId: c.id });
												setShowLocationPicker(false);
											}}
											className={`py-3 px-4 rounded-xl mb-2 border ${
												isSelected ? "border-orange-500" : "border-gray-200"
											}`}
											activeOpacity={0.7}
										>
											<View className="flex-row items-center">
												<MaterialIcons name="location-city" size={24} color="#EA580C" />
												<Text className="ml-3 text-lg font-semibold text-gray-900">
													{c.name}
												</Text>
											</View>
										</TouchableOpacity>
									);
								})
							) : (
								<Text className="text-gray-500">Không có danh sách thành phố</Text>
							)}
						</ScrollView>

						{/* Recent searches (bigger, with icon) */}
						{recentSearches.length > 0 && (
							<>
								<Text className="text-md text-gray-500 mb-3">Tìm kiếm gần đây</Text>
								{recentSearches.map((r, idx) => (
									<View key={idx} className="flex-row items-start justify-between mb-3">
										<TouchableOpacity
											onPress={() => {
												form.setValue("location", r.label, { shouldValidate: true });
												setSelectedCityId(r.cityId);
												setShowLocationPicker(false);
											}}
											className="flex-1 flex-row items-start"
										>
											<MaterialIcons name="place" size={20} color="#EA580C" />
											<Text
												className="ml-3 text-base flex-1"
												numberOfLines={2}
												ellipsizeMode="tail"
												style={{ flexShrink: 1 }}
											>
												{r.label}
											</Text>
										</TouchableOpacity>

										<TouchableOpacity
											onPress={async () => {
												const updated = recentSearches.filter((_, i) => i !== idx);
												setRecentSearches(updated);
												await AsyncStorage.setItem("recent_locations", JSON.stringify(updated));
											}}
											className="ml-4"
											accessibilityRole="button"
										>
											<Text className="text-red-500">Xóa</Text>
										</TouchableOpacity>
									</View>
								))}
							</>
						)}

						{/* <View className="flex-row justify-end mt-12">
							<TouchableOpacity onPress={() => setShowLocationPicker(false)} style={{ marginRight: 12 }}>
								<Text style={{ color: "#6B7280" }}>Hủy</Text>
							</TouchableOpacity>
						</View> */}
					</View>
				</View>
			</Modal>

			{/* Start Date Picker */}
			{showStartDatePicker && Platform.OS === "ios" && (
				<Modal
					transparent
					animationType="slide"
					visible={showStartDatePicker}
					onRequestClose={() => setShowStartDatePicker(false)}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => setShowStartDatePicker(false)}
						className="flex-1 bg-black/50 items-center justify-end"
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							className="w-full bg-white rounded-t-3xl p-4"
						>
							<View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
								<TouchableOpacity onPress={() => setShowStartDatePicker(false)} className="px-4 py-2">
									<Text className="text-base text-gray-600 font-medium">Hủy</Text>
								</TouchableOpacity>
								<Text className="text-lg font-bold text-gray-900">Ngày bắt đầu</Text>
								<TouchableOpacity
									onPress={() => setShowStartDatePicker(false)}
									className="px-4 py-2 bg-primary-600 rounded-lg"
								>
									<Text className="text-base font-semibold text-white">Xong</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={form.watch("startDate")}
								mode="datetime"
								display="spinner"
								onChange={handleStartDateChange}
								minimumDate={new Date()}
								themeVariant="light"
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>
			)}
			{showStartDatePicker && Platform.OS === "android" && (
				<DateTimePicker
					value={form.watch("startDate")}
					mode="datetime"
					display="default"
					onChange={handleStartDateChange}
					minimumDate={new Date()}
				/>
			)}

			{/* End Date Picker */}
			{showEndDatePicker && Platform.OS === "ios" && (
				<Modal
					transparent
					animationType="slide"
					visible={showEndDatePicker}
					onRequestClose={() => setShowEndDatePicker(false)}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => setShowEndDatePicker(false)}
						className="flex-1 bg-black/50 items-center justify-end"
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							className="w-full bg-white rounded-t-3xl p-4"
						>
							<View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
								<TouchableOpacity onPress={() => setShowEndDatePicker(false)} className="px-4 py-2">
									<Text className="text-base text-gray-600 font-medium">Hủy</Text>
								</TouchableOpacity>
								<Text className="text-lg font-bold text-gray-900">Ngày kết thúc</Text>
								<TouchableOpacity
									onPress={() => setShowEndDatePicker(false)}
									className="px-4 py-2 bg-primary-600 rounded-lg"
								>
									<Text className="text-base font-semibold text-white">Xong</Text>
								</TouchableOpacity>
							</View>
							<DateTimePicker
								value={form.watch("endDate")}
								mode="datetime"
								display="spinner"
								onChange={handleEndDateChange}
								minimumDate={form.watch("startDate")}
								themeVariant="light"
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>
			)}
			{showEndDatePicker && Platform.OS === "android" && (
				<DateTimePicker
					value={form.watch("endDate")}
					mode="datetime"
					display="default"
					onChange={handleEndDateChange}
					minimumDate={form.watch("startDate")}
					themeVariant="light"
				/>
			)}
		</View>
	);
}
