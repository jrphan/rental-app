import { useState, useMemo } from "react";
import { StatusBar, View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Tabs } from "@/components/ui/tabs";
import VehiclesList from "./components/VehiclesList";
import RentalsList from "./components/RentalsList";
import { vehicleStatusLabels } from "./types";
import type { Vehicle, Rental } from "./types";
import HeaderBase from "@/components/header/HeaderBase";
import { useQuery } from "@tanstack/react-query";
import { apiVehicle } from "@/services/api.vehicle";
import { apiRental, type Rental as ApiRental } from "@/services/api.rental";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/useToast";

export default function VehiclesScreen() {
	const router = useRouter();
	const { user, isAuthenticated } = useAuthStore();
	const toast = useToast();
	const [activeMainTab, setActiveMainTab] = useState("vehicles");
	const [activeVehicleStatus, setActiveVehicleStatus] = useState("ALL");

	// Fetch all vehicles from API - only when vehicles tab is active and authenticated
	const {
		data: vehiclesData,
		isLoading: isLoadingVehicles,
		isError: isErrorVehicles,
	} = useQuery({
		queryKey: ["myVehicles", "ALL"],
		queryFn: () => apiVehicle.getMyVehicles(), // Fetch all vehicles (no status filter)
		enabled: isAuthenticated && activeMainTab === "vehicles", // Only fetch when authenticated and vehicles tab is active
	});

	const allVehicles = useMemo(() => vehiclesData?.items || [], [vehiclesData?.items]);

	// Fetch all rentals from API (for renter) - only when rentals tab is active and authenticated
	const {
		data: renterRentalsData,
		isLoading: isLoadingRenterRentals,
		isError: isErrorRenterRentals,
	} = useQuery({
		queryKey: ["myRentals", "renter"],
		queryFn: () => apiRental.getMyRentals("renter"),
		enabled: isAuthenticated && activeMainTab === "rentals", // Only fetch when authenticated and rentals tab is active
	});

	// Fetch all rentals from API (for owner) - only when rentals tab is active and authenticated
	const {
		data: ownerRentalsData,
		isLoading: isLoadingOwnerRentals,
		isError: isErrorOwnerRentals,
	} = useQuery({
		queryKey: ["myRentals", "owner"],
		queryFn: () => apiRental.getMyRentals("owner"),
		enabled: isAuthenticated && activeMainTab === "rentals", // Only fetch when authenticated and rentals tab is active
	});

	// Memoize rentals arrays to avoid creating new arrays on every render
	const renterRentals = useMemo(() => renterRentalsData?.rentals || [], [renterRentalsData?.rentals]);
	const ownerRentals = useMemo(() => ownerRentalsData?.rentals || [], [ownerRentalsData?.rentals]);
	const allRentals = useMemo(() => [...renterRentals, ...ownerRentals], [renterRentals, ownerRentals]);

	const vehicleStatusTabs = useMemo(
		() => [
			{ label: "Tất cả", value: "ALL" },
			{ label: vehicleStatusLabels.PENDING, value: "PENDING" },
			{ label: vehicleStatusLabels.APPROVED, value: "APPROVED" },
			{ label: vehicleStatusLabels.REJECTED, value: "REJECTED" },
			{ label: vehicleStatusLabels.MAINTENANCE, value: "MAINTENANCE" },
			{ label: vehicleStatusLabels.HIDDEN, value: "HIDDEN" },
		],
		[]
	);

	// Map API rental to local Rental type (convert string prices to numbers)
	const mapApiRentalToRental = (apiRental: ApiRental): Rental => {
		return {
			id: apiRental.id,
			renterId: apiRental.renterId,
			ownerId: apiRental.ownerId,
			vehicleId: apiRental.vehicleId,
			startDate: apiRental.startDate,
			endDate: apiRental.endDate,
			durationMinutes: apiRental.durationMinutes,
			currency: apiRental.currency,
			pricePerDay: Number(apiRental.pricePerDay),
			deliveryFee: Number(apiRental.deliveryFee),
			discountAmount: Number(apiRental.discountAmount),
			totalPrice: Number(apiRental.totalPrice),
			depositPrice: Number(apiRental.depositPrice),
			platformFeeRatio: Number(apiRental.platformFeeRatio),
			platformFee: Number(apiRental.platformFee),
			ownerEarning: Number(apiRental.ownerEarning),
			status: apiRental.status,
			startOdometer: apiRental.startOdometer ?? undefined,
			endOdometer: apiRental.endOdometer ?? undefined,
			cancelReason: apiRental.cancelReason ?? undefined,
			owner: {
				id: apiRental.owner.id,
				phone: apiRental.owner.phone,
				fullName: apiRental.owner.fullName ?? null,
				email: apiRental.owner.email ?? null,
				avatar: apiRental.owner.avatar ?? null,
			},
			deliveryAddress: apiRental.deliveryAddress ?? null,
			createdAt: apiRental.createdAt,
			updatedAt: apiRental.updatedAt,
			vehicle: {
				id: apiRental.vehicle.id,
				brand: apiRental.vehicle.brand,
				model: apiRental.vehicle.model,
				licensePlate: apiRental.vehicle.licensePlate,
				fullAddress: apiRental.vehicle.fullAddress,
				address: apiRental.vehicle.address,
				ward: apiRental.vehicle.ward,
				district: apiRental.vehicle.district,
				city: apiRental.vehicle.city,
				lat: apiRental.vehicle.lat,
				lng: apiRental.vehicle.lng,
				images: apiRental.vehicle.images.map((img) => ({
					id: img.id,
					url: img.url,
					isPrimary: img.isPrimary,
					order: img.order,
				})),
			},
		};
	};

	// Memoize vehicles by status to avoid recalculation
	const vehiclesByStatus = useMemo(() => {
		const result: Record<string, Vehicle[]> = {};
		vehicleStatusTabs.forEach((tab) => {
			if (tab.value === "ALL") {
				result[tab.value] = allVehicles;
			} else {
				result[tab.value] = allVehicles.filter((vehicle) => vehicle.status === tab.value);
			}
		});
		return result;
	}, [allVehicles, vehicleStatusTabs]);

	const renderVehiclesContent = () => {
		if (!isAuthenticated) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50 px-6 py-12">
					<MaterialIcons name="info-outline" size={64} color="#9CA3AF" />
					<Text className="mt-4 text-lg font-semibold text-gray-900 text-center">Vui lòng đăng nhập</Text>
					<Text className="mt-2 text-base text-gray-600 text-center">
						Đăng nhập để xem và quản lý xe của bạn
					</Text>
					<TouchableOpacity
						onPress={() => router.push("/(auth)/login")}
						className="mt-6 bg-orange-600 rounded-xl px-6 py-3"
						style={{ backgroundColor: COLORS.primary }}
					>
						<Text className="text-white font-semibold text-base">Đăng nhập</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (isLoadingVehicles) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50">
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text className="mt-4 text-gray-600">Đang tải danh sách xe...</Text>
				</View>
			);
		}

		if (isErrorVehicles) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50 px-4">
					<Text className="text-red-600 text-center mb-4">Không thể tải danh sách xe. Vui lòng thử lại.</Text>
				</View>
			);
		}

		return (
			<Tabs
				tabs={vehicleStatusTabs.map((tab) => ({
					label: tab.label,
					value: tab.value,
					route: "",
					// Use contentFactory for lazy loading - only render when tab is active
					contentFactory: () => <VehiclesList vehicles={vehiclesByStatus[tab.value]} />,
				}))}
				variant="inline"
				defaultActiveTab={activeVehicleStatus}
				onTabChange={(value) => setActiveVehicleStatus(value)}
			/>
		);
	};

	// Memoize mapped rentals to avoid recalculation on every render
	const mappedAllRentals = useMemo(() => allRentals.map(mapApiRentalToRental), [allRentals]);
	const mappedOwnerRentals = useMemo(() => ownerRentals.map(mapApiRentalToRental), [ownerRentals]);
	const mappedRenterRentals = useMemo(() => renterRentals.map(mapApiRentalToRental), [renterRentals]);

	const renderRentalsContent = () => {
		if (!isAuthenticated) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50 px-6 py-12">
					<MaterialIcons name="info-outline" size={64} color="#9CA3AF" />
					<Text className="mt-4 text-lg font-semibold text-gray-900 text-center">Vui lòng đăng nhập</Text>
					<Text className="mt-2 text-base text-gray-600 text-center">
						Đăng nhập để xem và quản lý đơn thuê xe của bạn
					</Text>
					<TouchableOpacity
						onPress={() => router.push("/(auth)/login")}
						className="mt-6 bg-orange-600 rounded-xl px-6 py-3"
						style={{ backgroundColor: COLORS.primary }}
					>
						<Text className="text-white font-semibold text-base">Đăng nhập</Text>
					</TouchableOpacity>
				</View>
			);
		}

		const isLoading = isLoadingRenterRentals || isLoadingOwnerRentals;
		const isError = isErrorRenterRentals || isErrorOwnerRentals;

		if (isLoading) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50">
					<ActivityIndicator size="large" color={COLORS.primary} />
					<Text className="mt-4 text-gray-600">Đang tải danh sách đơn thuê...</Text>
				</View>
			);
		}

		if (isError) {
			return (
				<View className="flex-1 items-center justify-center bg-gray-50 px-4">
					<Text className="text-red-600 text-center mb-4">
						Không thể tải danh sách đơn thuê. Vui lòng thử lại.
					</Text>
				</View>
			);
		}

		return (
			<Tabs
				tabs={[
					{
						label: "Tất cả",
						value: "all",
						route: "",
						// Use contentFactory for lazy loading
						contentFactory: () => <RentalsList rentals={mappedAllRentals} showOwnerActions={false} />,
					},
					{
						label: "Xe được thuê",
						value: "owner",
						route: "",
						contentFactory: () => <RentalsList rentals={mappedOwnerRentals} showOwnerActions={true} />,
					},
					{
						label: "Đơn của tôi",
						value: "renter",
						route: "",
						contentFactory: () => <RentalsList rentals={mappedRenterRentals} showOwnerActions={false} />,
					},
				]}
				variant="inline"
				defaultActiveTab="all"
			/>
		);
	};

	const handleAddVehicle = () => {
		if (!isAuthenticated || !user) {
			toast.showInfo("Vui lòng đăng nhập để sử dụng chức năng này");
		} else {
			router.push("/(tabs)/vehicles/create");
		}
	};

	return (
		<>
			<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
			<SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
				<HeaderBase title="Xe và Đơn thuê" showBackButton />

				<Tabs
					tabs={[
						{
							label: "Xe của tôi",
							value: "vehicles",
							route: "",
							content: renderVehiclesContent(),
						},
						{
							label: "Đơn thuê xe",
							value: "rentals",
							route: "",
							content: renderRentalsContent(),
						},
					]}
					variant="pill"
					defaultActiveTab={activeMainTab}
					onTabChange={(value) => setActiveMainTab(value)}
					contentClassName="flex-1"
				/>

				{/* Floating Action Button - chỉ hiện khi tab "Xe của tôi" active */}
				{activeMainTab === "vehicles" && (
					<TouchableOpacity style={styles.fab} onPress={handleAddVehicle} activeOpacity={0.8}>
						<MaterialIcons name="add" size={28} color="#FFFFFF" />
					</TouchableOpacity>
				)}
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		bottom: 24,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: COLORS.primary,
		justifyContent: "center",
		alignItems: "center",
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
	},
});
