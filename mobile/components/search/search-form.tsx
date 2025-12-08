import { View, Text, TouchableOpacity, Platform, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Controller } from "react-hook-form";
import { useSearchForm } from "@/forms/search.forms";
import { vehiclesApi } from "@/lib/api.vehicles";
import { LocationPicker } from "@/components/location/location-picker";

interface SearchFormProps {
	initialLocation?: string;
	initialStartDate?: Date;
	initialEndDate?: Date;
	// include optional cityId and coords in callback
	onSearch?: (params: {
		location: string;
		startDate: Date;
		endDate: Date;
		cityId?: string;
		lat?: number;
		lng?: number;
	}) => void;
}

export function SearchForm({ initialLocation, initialStartDate, initialEndDate, onSearch }: SearchFormProps) {
	const router = useRouter();
	const form = useSearchForm({
		location: initialLocation,
		startDate: initialStartDate,
		endDate: initialEndDate,
	});

	const [showStartDatePicker, setShowStartDatePicker] = useState(false);
	const [showEndDatePicker, setShowEndDatePicker] = useState(false);
	const [showLocationPicker, setShowLocationPicker] = useState(false);
	const [cities, setCities] = useState<any[]>([]);
	const [selectedCityId, setSelectedCityId] = useState<string | undefined>(undefined);

	// load cities & recents
	useEffect(() => {
		(async () => {
			try {
				const c = await vehiclesApi.getCities();
				setCities(c || []);
			} catch (e) {
				// ignore
			}
			// try {
			// 	const s = await AsyncStorage.getItem("recent_locations");
			// 	if (s) setRecentSearches(JSON.parse(s));
			// } catch {}
		})();
	}, []);

	// Sync with props changes
	useEffect(() => {
		if (initialLocation || initialStartDate || initialEndDate) {
			form.reset({
				location: initialLocation,
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

	// Update handleSearch to include lat/lng params when navigating
	const handleSearch = (data: typeof form.formState.defaultValues) => {
		if (data?.location && data?.startDate && data?.endDate) {
			const lat = form.getValues("__selected_lat") as number | undefined;
			const lng = form.getValues("__selected_lng") as number | undefined;
			if (onSearch) {
				onSearch({
					location: data.location,
					startDate: data.startDate,
					endDate: data.endDate,
					cityId: selectedCityId,
					lat: lat,
					lng: lng,
				});
			} else {
				router.push({
					pathname: "/search",
					params: {
						location: data.location,
						startDate: data.startDate.toISOString(),
						endDate: data.endDate.toISOString(),
						cityId: selectedCityId,
						lat: lat ? String(lat) : undefined,
						lng: lng ? String(lng) : undefined,
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
			<LocationPicker
				visible={showLocationPicker}
				onClose={() => setShowLocationPicker(false)}
				cities={cities}
				showRecents={true} // enable recents here
				onPick={(p) => {
					form.setValue("location", p.display || "", { shouldValidate: true });
					if (p.cityId) setSelectedCityId(p.cityId);
					if (p.lat && p.lng) {
						// store coords temporarily in component state to forward on search
						form.setValue("__selected_lat", p.lat as any);
						form.setValue("__selected_lng", p.lng as any);
					}
					setShowLocationPicker(false);
				}}
			/>

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
