import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, TouchableOpacity, RefreshControl, FlatListProps } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState, useMemo, useCallback } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SearchForm } from "@/components/search/search-form";
import { distanceKm } from "@/lib/geocode";
import { FilterModal } from "@/components/search/filter-modal";
import { VehicleMap, Cluster } from "@/components/map/vehicle-map";
import MiniVehicleCard from "@/components/vehicle/mini-card";

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

	const [showMap, setShowMap] = useState(false);
	const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

	// group vehicles into clusters (simple grid rounding)
	const clusters: Cluster[] = useMemo(() => {
		const map = new Map<string, Cluster>();
		vehicles.forEach((v: any) => {
			const lat = typeof v.latitude === "number" ? v.latitude : undefined;
			const lng = typeof v.longitude === "number" ? v.longitude : undefined;
			if (lat === undefined || lng === undefined) return;
			// compute approximate distance to target (if provided)
			const dist =
				typeof targetLat === "number" && typeof targetLng === "number"
					? distanceKm(targetLat, targetLng, lat, lng)
					: undefined;
			// attach distance to vehicle object for mini-cards
			v.distanceKm = dist;
			const key = `${Math.round(lat * 1000) / 1000}_${Math.round(lng * 1000) / 1000}`;
			if (!map.has(key)) {
				map.set(key, { id: key, latitude: lat, longitude: lng, count: 0, vehicles: [] });
			}
			const c = map.get(key)!;
			c.vehicles.push(v);
			c.count = c.vehicles.length;
			// keep centroid approx as first item's coords (fine for small grid)
			c.latitude = c.vehicles[0].latitude;
			c.longitude = c.vehicles[0].longitude;
		});
		return Array.from(map.values());
	}, [vehicles]);

	const selectedCluster = useMemo(
		() => clusters.find((c) => c.id === selectedClusterId) || null,
		[clusters, selectedClusterId]
	);

	const initialRegion = useMemo(() => {
		if (targetLat !== undefined && targetLng !== undefined) {
			return { latitude: targetLat, longitude: targetLng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
		}
		if (
			vehicles.length > 0 &&
			typeof vehicles[0].latitude === "number" &&
			typeof vehicles[0].longitude === "number"
		) {
			return {
				latitude: vehicles[0].latitude,
				longitude: vehicles[0].longitude,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
			};
		}
		return undefined;
	}, [targetLat, targetLng, vehicles]);

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
					<>
						{!showMap ? (
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
										{/* Results Header + Toggle */}
										<View className="px-6 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
											<Text className="text-base font-semibold text-gray-900">
												{data?.total ? `${data.total} xe được tìm thấy` : "Đang tìm kiếm..."}
											</Text>
											<TouchableOpacity
												onPress={() => {
													setShowMap(true);
													// clear selected cluster on open
													setSelectedClusterId(null);
												}}
												className="flex-row items-center bg-white px-3 py-2 rounded-full"
											>
												<MaterialIcons name="map" size={18} color="#111827" />
												<Text className="ml-2 text-sm font-medium text-gray-900">Bản đồ</Text>
											</TouchableOpacity>
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
						) : (
							<View style={{ flex: 1 }}>
								{/* Map header (search form stays on top inside ListHeader in list mode; keep a compact header here) */}
								<View className="px-6 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
									<Text className="text-base font-semibold text-gray-900">
										{data?.total ? `${data.total} xe được tìm thấy` : "Đang tìm kiếm..."}
									</Text>
									<TouchableOpacity
										onPress={() => {
											setShowMap(false);
											setSelectedClusterId(null);
										}}
										className="flex-row items-center bg-white px-3 py-2 rounded-full"
									>
										<MaterialIcons name="list" size={18} color="#111827" />
										<Text className="ml-2 text-sm font-medium text-gray-900">Danh sách</Text>
									</TouchableOpacity>
								</View>

								{/* Map */}
								<View style={{ flex: 1 }}>
									<VehicleMap
										clusters={clusters}
										initialRegion={initialRegion}
										selectedClusterId={selectedClusterId ?? undefined}
										onSelectCluster={(id) =>
											setSelectedClusterId((prev) => (prev === id ? null : id))
										}
									/>
								</View>

								{/* Bottom mini vehicle scroller when a cluster selected */}
								{selectedCluster && selectedCluster.vehicles.length > 0 && (
									<View className="absolute bottom-24 left-0 right-0">
										<FlatList
											data={selectedCluster.vehicles}
											horizontal
											keyExtractor={(it) => it.id}
											contentContainerStyle={{ paddingHorizontal: 12 }}
											showsHorizontalScrollIndicator={false}
											renderItem={({ item }) => (
												<MiniVehicleCard vehicle={item} distanceKm={item.distanceKm} />
											)}
										/>
									</View>
								)}
							</View>
						)}
					</>
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
