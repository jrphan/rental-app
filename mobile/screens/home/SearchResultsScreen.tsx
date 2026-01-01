import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import FilterModal, { type SearchFilters } from "@/components/search/FilterModal";
import { detectLicensePlateTokens } from "@/utils/search.utils";
import { apiVehicle } from "@/services/api.vehicle";
import { COLORS } from "@/constants/colors";
import VehicleCard from "@/screens/vehicles/components/VehicleCard";
import VehicleSearchBar from "../home/components/VehicleSearchBar";
import type { Vehicle } from "@/screens/vehicles/types";
import { calculateDistanceKm } from "@/utils/geo";
import VehiclesMap from "@/components/map/VehiclesMap";

export default function SearchResultsScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		search?: string;
		city?: string;
		district?: string;
		startDate?: string;
		endDate?: string;
		lat?: string;
		lng?: string;
		radius?: string;
		type?: string;
		minPrice?: string;
		maxPrice?: string;
		sortBy?: string;
	}>();

	const [location, setLocation] = useState<{
		city?: string;
		district?: string;
		lat?: number;
		lng?: number;
	}>({
		city: params.city,
		district: params.district,
		lat: params.lat ? Number(params.lat) : undefined,
		lng: params.lng ? Number(params.lng) : undefined,
	});

	const [dateRange, setDateRange] = useState<{
		startDate?: Date;
		endDate?: Date;
	}>({
		startDate: params.startDate ? new Date(params.startDate) : undefined,
		endDate: params.endDate ? new Date(params.endDate) : undefined,
	});

	const [searchText, setSearchText] = useState(params.search || "");
	const [filterModalVisible, setFilterModalVisible] = useState(false);
	const [activeFilters, setActiveFilters] = useState<SearchFilters>({});
	const [hasActiveFilter, setHasActiveFilter] = useState(false);
	const [viewMode, setViewMode] = useState<"list" | "map">("list");
	const [mapFullScreen, setMapFullScreen] = useState(false);

	// Sync searchText với params khi params thay đổi
	useEffect(() => {
		if (params.search !== undefined) {
			setSearchText(params.search);
		}
	}, [params.search]);

	// Parse search filters from params
	const searchFilters = {
		search: params.search,
		city: location.city,
		district: location.district,
		startDate: dateRange.startDate,
		endDate: dateRange.endDate,
		lat: location.lat,
		lng: location.lng,
		radius: params.radius ? Number(params.radius) : undefined,
	};

	useEffect(() => {
		// indicator if filters not empty or search param exists
		const has =
			// !!params.search ||
			!!activeFilters.lat ||
			!!activeFilters.types?.length ||
			!!activeFilters.minPrice ||
			!!activeFilters.maxPrice ||
			!!activeFilters.sortBy;
		setHasActiveFilter(!!has);
	}, [params.search, activeFilters]);

	const handleSearch = (filters: {
		search?: string;
		city?: string;
		district?: string;
		startDate?: Date;
		endDate?: Date;
		lat?: number;
		lng?: number;
		radius?: number;
	}) => {
		// Update local searchText state
		if (filters.search !== undefined) {
			setSearchText(filters.search);
		}
		// Navigate to search results screen with filters as params
		const newParams = new URLSearchParams();
		if (filters.search) newParams.append("search", filters.search);
		if (filters.city) newParams.append("city", filters.city);
		if (filters.district) newParams.append("district", filters.district);
		if (filters.startDate) newParams.append("startDate", filters.startDate.toISOString());
		if (filters.endDate) newParams.append("endDate", filters.endDate.toISOString());
		if (filters.lat) newParams.append("lat", filters.lat.toString());
		if (filters.lng) newParams.append("lng", filters.lng.toString());
		if (filters.radius) newParams.append("radius", filters.radius.toString());

		router.replace(`/search?${newParams.toString()}` as any);
	};

	const handleCityChange = (city: string) => {
		setLocation((prev) => ({ ...prev, city }));
	};

	const handleLocationChange = (lat: number, lng: number) => {
		setLocation((prev) => ({ ...prev, lat, lng }));
	};

	const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
		// Validation: endDate phải >= startDate
		if (startDate && endDate && endDate < startDate) {
			// Nếu endDate < startDate, chỉ cập nhật startDate và xóa endDate
			setDateRange({ startDate, endDate: undefined });
			return;
		}
		setDateRange({ startDate, endDate });
	};

	const handleApplyFilters = (f: SearchFilters) => {
		// set filters
		setActiveFilters(f);
	};

	// Build searchFilters for queryFn (include normalized query + licensePlate token)
	const builtFilters = {
		...searchFilters,
		licensePlate: detectLicensePlateTokens(searchFilters.search),
		// lat/lng/radius: prefer params then activeFilters (so immediate query after apply works)
		lat: params.lat ? Number(params.lat) : activeFilters.lat,
		lng: params.lng ? Number(params.lng) : activeFilters.lng,
		radius: params.radius ? Number(params.radius) : activeFilters.radius,
		type: params.type
			? String(params.type)
			: activeFilters.types?.length
				? activeFilters.types.join(",")
				: undefined,
		minPrice: params.minPrice ? Number(params.minPrice) : activeFilters.minPrice,
		maxPrice: params.maxPrice ? Number(params.maxPrice) : activeFilters.maxPrice,
		sortBy: params.sortBy ? String(params.sortBy) : activeFilters.sortBy,
	};

	const {
		data: searchResults,
		isLoading: isLoadingSearch,
		isError: isErrorSearch,
	} = useQuery({
		queryKey: ["searchVehicles", builtFilters],
		queryFn: () =>
			apiVehicle.searchVehicles({
				...builtFilters,
				startDate: builtFilters.startDate ? builtFilters.startDate.toISOString() : undefined,
				endDate: builtFilters.endDate ? builtFilters.endDate.toISOString() : undefined,
			}),
	});

	const renderVehicleList = (vehicles: Vehicle[] | undefined) => {
		if (!vehicles || vehicles.length === 0) {
			return (
				<View className="py-8 items-center">
					<MaterialIcons name="search-off" size={64} color="#9CA3AF" />
					<Text className="mt-4 text-gray-500 text-center">Không tìm thấy xe nào phù hợp</Text>
					<Text className="mt-2 text-sm text-gray-400 text-center px-4">
						Hãy thử thay đổi bộ lọc tìm kiếm của bạn
					</Text>
				</View>
			);
		}

		return (
			<View>
				{vehicles.map((vehicle) => {
					// compute distance if we have reference location
					const refLat = builtFilters.lat as number | undefined;
					const refLng = builtFilters.lng as number | undefined;
					const distanceKm =
						refLat && refLng && vehicle.lat != null && vehicle.lng != null
							? Number(
									calculateDistanceKm(
										refLat,
										refLng,
										Number(vehicle.lat),
										Number(vehicle.lng)
									).toFixed(1)
								)
							: undefined;

					return <VehicleCard key={vehicle.id} vehicle={vehicle} variant="full" distanceKm={distanceKm} />;
				})}
			</View>
		);
	};

	const getSearchSummary = () => {
		const parts: string[] = [];
		if (searchFilters.search) parts.push(`"${searchFilters.search}"`);
		if (searchFilters.city) parts.push(`tại ${searchFilters.city}`);
		if (searchFilters.district) parts.push(`quận ${searchFilters.district}`);
		if (searchFilters.startDate && searchFilters.endDate) {
			const start = searchFilters.startDate.toLocaleDateString("vi-VN");
			const end = searchFilters.endDate.toLocaleDateString("vi-VN");
			parts.push(`từ ${start} đến ${end}`);
		}
		return parts.length > 0 ? parts.join(" • ") : "Tất cả xe";
	};

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
			<HeaderBase
				title="Tìm kiếm xe"
				showBackButton
				action={
					<TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ padding: 6 }}>
						<MaterialIcons
							name="filter-list"
							size={22}
							color={hasActiveFilter ? COLORS.primary : "#111827"}
						/>
						{hasActiveFilter && (
							<View
								style={{
									position: "absolute",
									right: 0,
									top: 0,
									width: 8,
									height: 8,
									borderRadius: 4,
									backgroundColor: COLORS.primary,
								}}
							/>
						)}
					</TouchableOpacity>
				}
			/>

			{mapFullScreen ? (
				/* Render map full screen area (below header) */
				<VehiclesMap
					vehicles={searchResults?.items || []}
					initialLat={builtFilters.lat as number}
					initialLng={builtFilters.lng as number}
					fullScreen
					onToggleFullScreen={() => setMapFullScreen(false)}
				/>
			) : (
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 24 }}
				>
					{/* Search Bar */}
					<View className="px-4 pt-4 pb-2 mb-4">
						<VehicleSearchBar
							onSearch={handleSearch}
							onCityChange={handleCityChange}
							onLocationChange={handleLocationChange}
							onDateRangeChange={handleDateRangeChange}
							location={location}
							dateRange={dateRange}
							searchText={searchText}
						/>
					</View>

					<View className="px-4 pt-2">
						{/* Search Summary */}
						<View className="mb-4">
							<Text className="text-sm text-gray-600 mb-1">Đang tìm kiếm: {getSearchSummary()}</Text>
							<View
								style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
							>
								<Text className="text-base font-semibold text-gray-900">
									{searchResults && searchResults.total > 0
										? `Tìm thấy ${searchResults.total} xe`
										: "—"}
								</Text>
								<TouchableOpacity
									onPress={() => setViewMode((v) => (v === "list" ? "map" : "list"))}
									style={{ flexDirection: "row", alignItems: "center", padding: 8 }}
								>
									<MaterialIcons
										name={viewMode === "map" ? "view-list" : "map"}
										size={20}
										color="#111827"
									/>
									<Text style={{ marginLeft: 8, fontWeight: "600" }}>
										{viewMode === "map" ? "Danh sách" : "Bản đồ"}
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Results */}
						{isLoadingSearch ? (
							<View className="py-12 items-center">
								<ActivityIndicator size="large" color={COLORS.primary} />
								<Text className="mt-4 text-gray-600">Đang tìm kiếm...</Text>
							</View>
						) : isErrorSearch ? (
							<View className="py-12 items-center">
								<MaterialIcons name="error-outline" size={64} color="#EF4444" />
								<Text className="mt-4 text-red-600 text-center">
									Không thể tìm kiếm. Vui lòng thử lại.
								</Text>
								<TouchableOpacity
									onPress={() => router.back()}
									className="mt-4 px-6 py-2 bg-primary rounded-lg"
									style={{ backgroundColor: COLORS.primary }}
								>
									<Text className="text-white font-semibold">Quay lại</Text>
								</TouchableOpacity>
							</View>
						) : viewMode === "list" ? (
							renderVehicleList(searchResults?.items)
						) : (
							<VehiclesMap
								vehicles={searchResults?.items || []}
								initialLat={builtFilters.lat as number}
								initialLng={builtFilters.lng as number}
								onToggleFullScreen={() => setMapFullScreen(true)}
							/>
						)}
					</View>
				</ScrollView>
			)}

			<FilterModal
				visible={filterModalVisible}
				initial={activeFilters}
				onClose={() => setFilterModalVisible(false)}
				onApply={handleApplyFilters}
			/>
		</SafeAreaView>
	);
}
