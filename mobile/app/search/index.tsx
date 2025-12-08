import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState, useMemo } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SearchForm } from "@/components/search/search-form";
import { distanceKm } from "@/lib/geocode";

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

	// modal-local filter (temp) used inside Filter Modal
	const [modalFilter, setModalFilter] = useState<typeof filter>(filter);
	const [sortModalVisible, setSortModalVisible] = useState(false);

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
		// close any open sort modal as well
		setSortModalVisible(false);
		setShowFilter(false);
		// small delay to allow modal close animation then refetch
		setTimeout(() => refetch(), 150);
	};

	// open Filter modal, initialize modalFilter from current applied filter
	const openFilterModal = () => {
		setModalFilter(filter || {});
		setShowFilter(true);
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
						<TouchableOpacity onPress={openFilterModal} className="p-2">
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

			{/* Filter Modal - bigger, more spacing, larger text */}
			<Modal visible={showFilter} transparent animationType="slide" onRequestClose={() => setShowFilter(false)}>
				<TouchableOpacity
					activeOpacity={1}
					onPress={() => setShowFilter(false)}
					style={{
						flex: 1,
						justifyContent: "flex-end",
						backgroundColor: "rgba(0,0,0,0.45)",
					}}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={(e) => e.stopPropagation()}
						style={{
							backgroundColor: "#fff",
							padding: 20,
							borderTopLeftRadius: 20,
							borderTopRightRadius: 20,
							minHeight: "92%", // slight increase so content scrolls and actions sit above system bar
							position: "relative",
						}}
					>
						{/* Header with close icon */}
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 10,
							}}
						>
							<Text style={{ fontSize: 20, fontWeight: "700" }}>Bộ lọc</Text>
							<TouchableOpacity
								onPress={() => setShowFilter(false)}
								style={{
									width: 36,
									height: 36,
									borderRadius: 18,
									backgroundColor: "#F3F4F6",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<MaterialIcons name="close" size={20} color="#6B7280" />
							</TouchableOpacity>
						</View>

						<ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
							{/* Vehicle types (use description) */}
							<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
								Loại xe
							</Text>
							<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
								{vehicleTypes?.map((t: any) => {
									const selected = (modalFilter.vehicleTypeIds || []).includes(t.id);
									return (
										<TouchableOpacity
											key={t.id}
											onPress={() => {
												setModalFilter((cur) => {
													const ids = cur.vehicleTypeIds || [];
													return {
														...cur,
														vehicleTypeIds: ids.includes(t.id)
															? ids.filter((x) => x !== t.id)
															: [...ids, t.id],
													};
												});
											}}
											style={{
												paddingVertical: 8,
												paddingHorizontal: 12,
												borderRadius: 20,
												borderWidth: 1,
												borderColor: selected ? "#EA580C" : "#DDD",
												margin: 4,
											}}
										>
											<Text style={{ color: selected ? "#EA580C" : "#000" }}>
												{t.description || t.name}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>

							{/* Price range: numeric inputs (no slider) */}
							<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
								Khoảng giá (VND) mỗi ngày
							</Text>
							<View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 6 }}>
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Min (₫)</Text>
									<TextInput
										placeholder="0"
										placeholderTextColor="#9CA3AF"
										keyboardType="numeric"
										value={modalFilter.minPrice ? String(modalFilter.minPrice) : ""}
										onChangeText={(t) =>
											setModalFilter((m) => ({
												...m,
												minPrice: t ? Number(t.replace(/[^0-9]/g, "")) : undefined,
											}))
										}
										style={{
											borderWidth: 1,
											borderColor: "#E5E7EB",
											padding: 10,
											borderRadius: 8,
											backgroundColor: "#fff",
											color: "#111827",
										}}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Max (₫)</Text>
									<TextInput
										placeholder="2000000"
										placeholderTextColor="#9CA3AF"
										keyboardType="numeric"
										value={modalFilter.maxPrice ? String(modalFilter.maxPrice) : ""}
										onChangeText={(t) =>
											setModalFilter((m) => ({
												...m,
												maxPrice: t ? Number(t.replace(/[^0-9]/g, "")) : undefined,
											}))
										}
										style={{
											borderWidth: 1,
											borderColor: "#E5E7EB",
											padding: 10,
											borderRadius: 8,
											backgroundColor: "#fff",
											color: "#111827",
										}}
									/>
								</View>
							</View>

							{/* Sort input (opens small modal) - placed at the end */}
							<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
								Sắp xếp
							</Text>
							<View>
								<TouchableOpacity
									onPress={() => setSortModalVisible(true)}
									style={{
										borderWidth: 1,
										borderColor: "#E5E7EB",
										padding: 12,
										borderRadius: 8,
										flexDirection: "row",
										alignItems: "center",
										justifyContent: "space-between",
										backgroundColor: "#fff",
									}}
								>
									<Text style={{ color: modalFilter.sort ? "#111" : "#9CA3AF" }}>
										{modalFilter.sort === "price_asc"
											? "Giá tăng dần"
											: modalFilter.sort === "price_desc"
											? "Giá giảm dần"
											: modalFilter.sort === "distance"
											? "Khoảng cách gần nhất"
											: modalFilter.sort === "rating"
											? "Đánh giá"
											: "Chọn cách sắp xếp"}
									</Text>
									<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
										{modalFilter.sort ? (
											<TouchableOpacity
												onPress={() => setModalFilter((m) => ({ ...m, sort: undefined }))}
												style={{ padding: 6 }}
											>
												<MaterialIcons name="close" size={18} color="#6B7280" />
											</TouchableOpacity>
										) : null}
										<MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
									</View>
								</TouchableOpacity>
							</View>
						</ScrollView>

						{/* Action bar: fixed-ish above bottom */}
						<View
							style={{
								position: "absolute",
								left: 0,
								right: 0,
								bottom: 50,
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								borderTopWidth: 1,
								borderTopColor: "#ccccccff",
								padding: 25,
							}}
						>
							<TouchableOpacity
								onPress={() => {
									// reset modalFilter (no immediate apply)
									setModalFilter({});
								}}
								style={{ padding: 12 }}
							>
								<Text style={{ fontSize: 16, textDecorationLine: "underline" }}>Đặt lại</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => {
									// apply
									applyFilter(modalFilter);
								}}
								style={{
									backgroundColor: "#EA580C",
									paddingVertical: 12,
									paddingHorizontal: 32,
									borderRadius: 8,
								}}
							>
								<Text style={{ color: "#fff", fontSize: 16 }}>Áp dụng</Text>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</TouchableOpacity>
				{/* Sort options modal */}
				<Modal
					visible={sortModalVisible}
					transparent
					animationType="slide"
					onRequestClose={() => setSortModalVisible(false)}
				>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => setSortModalVisible(false)}
						style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							style={{
								backgroundColor: "#fff",
								borderTopLeftRadius: 12,
								borderTopRightRadius: 12,
								padding: 20,
								minHeight: "33%",
							}}
						>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 12,
								}}
							>
								<Text style={{ fontSize: 18, fontWeight: "700" }}>Sắp xếp theo</Text>
								<TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ padding: 6 }}>
									<MaterialIcons name="close" size={20} color="#6B7280" />
								</TouchableOpacity>
							</View>
							{[
								{ key: "price_asc", label: "Giá tăng dần" },
								{ key: "price_desc", label: "Giá giảm dần" },
								{ key: "distance", label: "Khoảng cách gần nhất" },
								{ key: "rating", label: "Đánh giá" },
							].map((s) => {
								const selected = modalFilter.sort === s.key;
								return (
									<TouchableOpacity
										key={s.key}
										onPress={() => {
											setModalFilter((m) => ({ ...m, sort: s.key as any }));
											setSortModalVisible(false);
										}}
										style={{
											paddingVertical: 12,
											paddingHorizontal: 6,
											flexDirection: "row",
											alignItems: "center",
											justifyContent: "space-between",
										}}
									>
										<Text style={{ color: selected ? "#EA580C" : "#111", fontSize: 16 }}>
											{s.label}
										</Text>
										{selected ? <MaterialIcons name="check" size={20} color="#EA580C" /> : null}
									</TouchableOpacity>
								);
							})}
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>
			</Modal>
		</SafeAreaView>
	);
}
