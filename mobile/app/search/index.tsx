import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SearchForm } from "@/components/search/search-form";
import { distanceKm } from "@/lib/geocode";
import { FilterModal } from "@/components/search/filter-modal";

export default function SearchScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{
		location?: string;
		startDate?: string;
		endDate?: string;
		cityId?: string;
	}>();

	// Move filter & city state and vehicleTypes hook above data useQuery
	const [filter, setFilter] = useState<{
		sort?: "price_asc" | "price_desc" | "distance" | "rating";
		vehicleTypeIds?: string[];
		minPrice?: number;
		maxPrice?: number;
	}>({});

	const [cityId, setCityId] = useState<string | undefined>((params as any).cityId);
	// target coordinates used for distance calculation (can come from params or in-place search)
	const [targetLat, setTargetLat] = useState<number | undefined>(params.lat ? Number(params.lat) : undefined);
	const [targetLng, setTargetLng] = useState<number | undefined>(params.lng ? Number(params.lng) : undefined);

	const { data: vehicleTypes } = useQuery({
		queryKey: ["vehicle-types"],
		queryFn: () => vehiclesApi.getTypes(),
		staleTime: 1000 * 60 * 5,
	});

	const [page] = useState(1);
	const [refreshing, setRefreshing] = useState(false);
	const [location, setLocation] = useState(params.location);
	const [startDate, setStartDate] = useState(params.startDate ? new Date(params.startDate) : new Date());
	const [endDate, setEndDate] = useState(
		params.endDate ? new Date(params.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000)
	);

	// Query uses actual applied `filter` (not modalFilter)
	const { data, isLoading, refetch } = useQuery({
		queryKey: [
			"vehicles-search",
			{ page, location, startDate: startDate.toISOString(), endDate: endDate.toISOString(), cityId, filter },
		],
		queryFn: () =>
			vehiclesApi.listPublic({
				page,
				limit: 20,
				cityId,
				vehicleTypeIds: filter.vehicleTypeIds,
				minPrice: filter.minPrice,
				maxPrice: filter.maxPrice,
				sort: filter.sort,
			}),
		enabled: true,
	});

	const [showFilter, setShowFilter] = useState(false);
	const [modalFilter, setModalFilter] = useState<typeof filter>(filter);

	const hasFilterChanged = !!(
		filter.sort ||
		(filter.vehicleTypeIds && filter.vehicleTypeIds.length) ||
		filter.minPrice ||
		filter.maxPrice
	);

	const onRefresh = async () => {
		setRefreshing(true);
		await refetch();
		setRefreshing(false);
	};

	// Updated handleSearch signature to accept optional cityId
	const handleSearch = (searchParams: {
		location: string;
		startDate: Date;
		endDate: Date;
		cityId?: string;
		lat?: number;
		lng?: number;
	}) => {
		setLocation(searchParams.location);
		setStartDate(searchParams.startDate);
		setEndDate(searchParams.endDate);
		if (searchParams.cityId) setCityId(searchParams.cityId);
		// when search invoked in-place, update target coordinates so distances recalc immediately
		if (typeof searchParams.lat === "number" && typeof searchParams.lng === "number") {
			setTargetLat(searchParams.lat);
			setTargetLng(searchParams.lng);
		} else {
			// if caller didn't supply coords, clear target coords so distances are not shown
			setTargetLat(undefined);
			setTargetLng(undefined);
		}
	};

	// apply modalFilter to active filter and refetch
	const applyFilter = (newFilter: typeof filter) => {
		setFilter(newFilter);
		setShowFilter(false);
		setTimeout(() => refetch(), 150);
	};

	const resetFilter = () => {
		// any extra reset logic (kept for compatibility)
	};

	// Query will automatically refetch when queryKey changes

	const vehicles = data?.items || [];

	// targetLat/targetLng are kept in state (initialized from params)

	const itemsWithDistance = useMemo(() => {
		if (targetLat !== undefined && targetLng !== undefined) {
			return vehicles
				.map((v: any) => {
					const lat = v.latitude;
					const lon = v.longitude;
					const dist =
						typeof lat === "number" && typeof lon === "number"
							? distanceKm(targetLat, targetLng, lat, lon)
							: undefined;
					return { ...v, distanceKm: dist };
				})
				.sort((a: any, b: any) => {
					if (filter.sort === "distance") {
						// put undefined distances at the end
						const ad = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
						const bd = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
						return ad - bd;
					}
					return 0;
				});
		}
		// no target: optionally sort by filter.sort for price etc (existing backend orderBy)
		return vehicles;
	}, [vehicles, targetLat, targetLng, filter.sort]);

	return (
		<SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
			<View className="flex-1">
				{/* Header */}
				<View className="bg-white px-6 py-4 border-b border-gray-200">
					<View className="flex-row items-center">
						<TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
							<MaterialIcons name="arrow-back" size={24} color="#111827" />
						</TouchableOpacity>
						<View className="flex-1 items-center">
							<Text className="text-xl font-bold text-gray-900">Tìm kiếm xe</Text>
						</View>
						{/* -						<TouchableOpacity onPress={() => setShowFilter(true)} className="p-2"> */}
						<TouchableOpacity onPress={() => setShowFilter(true)} className="p-2">
							<MaterialIcons
								name="filter-list"
								size={24}
								color={hasFilterChanged ? "#EF4444" : "#111827"}
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* Vehicle List with Search Form */}
				{isLoading && !data ? (
					<View className="flex-1 items-center justify-center">
						<Text className="text-gray-600">Đang tải kết quả...</Text>
					</View>
				) : !data?.items || data.items.length === 0 ? (
					<View className="flex-1 items-center justify-center px-6">
						<MaterialIcons name="search-off" size={64} color="#9CA3AF" />
						<Text className="mt-4 text-lg font-semibold text-gray-900">Không tìm thấy xe</Text>
						<Text className="mt-2 text-center text-gray-600">
							Không có xe nào phù hợp với tiêu chí tìm kiếm của bạn
						</Text>
					</View>
				) : (
					<FlatList
						data={itemsWithDistance}
						keyExtractor={(item) => item.id}
						ListHeaderComponent={
							<>
								<View className="pt-4">
									<SearchForm
										initialLocation={location}
										initialStartDate={startDate}
										initialEndDate={endDate}
										onSearch={handleSearch}
									/>
								</View>
								{/* Results Header */}
								<View className="px-6 py-3 bg-white border-b border-gray-200">
									<Text className="text-base font-semibold text-gray-900">
										{data?.total ? `${data.total} xe được tìm thấy` : "Đang tìm kiếm..."}
									</Text>
								</View>
							</>
						}
						renderItem={({ item }) => (
							<View className="px-6">
								<VehicleCard vehicle={item} distanceKm={item.distanceKm} />
							</View>
						)}
						contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
						showsVerticalScrollIndicator={false}
					/>
				)}
			</View>

			{/* Filter Modal replaced by component */}
			<FilterModal
				visible={showFilter}
				onClose={() => setShowFilter(false)}
				vehicleTypes={vehicleTypes || []}
				modalFilter={modalFilter}
				setModalFilter={setModalFilter}
				onApply={applyFilter}
				onReset={resetFilter}
			/>
		</SafeAreaView>
	);
}
