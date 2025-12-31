import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import type { Vehicle } from "@/screens/vehicles/types";
import { formatPrice } from "@/screens/vehicles/utils";
import { useQuery } from "@tanstack/react-query";
import { apiReview } from "@/services/api.review";
import VehicleStats from "@/screens/vehicles/components/VehicleStats";

interface Props {
	vehicle: Vehicle;
	distanceKm?: number;
	onPress: () => void;
}

export default function MiniVehicleCard({ vehicle, distanceKm, onPress }: Props) {
	const img = vehicle.images && vehicle.images.length ? vehicle.images[0].url : undefined;

	// Fetch reviews
	const { data: reviewsData } = useQuery({
		queryKey: ["vehicleReviews", vehicle.id],
		queryFn: () => {
			if (!vehicle.id) throw new Error("Vehicle Id is required");
			return apiReview.getVehicleReviews(vehicle.id);
		},
		enabled: !!vehicle.id && !!vehicle,
	});

	const completedTrips = (vehicle as any).completedTrips ?? 0;
	const rating = reviewsData?.averageRating || 0;

	return (
		<TouchableOpacity onPress={onPress} style={styles.card}>
			<Image source={{ uri: img }} style={styles.image} />
			<View style={{ flex: 1, paddingLeft: 8 }}>
				<Text numberOfLines={1} style={styles.title}>
					{vehicle.brand} {vehicle.model}
				</Text>
				<Text numberOfLines={1} style={styles.sub}>
					{vehicle.ward ? `${vehicle.ward}, ${vehicle.district}` : vehicle.district || vehicle.address || "-"}
				</Text>

				{/* Hiển thị thống kê xe */}
				<VehicleStats completedTrips={completedTrips} rating={rating} compact={true} />

				<View
					style={{
						flexDirection: "row",
						justifyContent: "space-between",
						marginTop: 6,
						borderTopWidth: 1,
						borderTopColor: "#E5E7EB",
						paddingTop: 4,
					}}
				>
					<Text style={styles.price}>{formatPrice(Number(vehicle.pricePerDay))}</Text>
					{typeof distanceKm === "number" && <Text style={styles.distance}>• {distanceKm} km</Text>}
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		width: 300,
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 8,
		marginRight: 12,
		flexDirection: "row",
		alignItems: "center",
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 6,
		elevation: 3,
	},
	image: { width: 80, height: 60, borderRadius: 8, backgroundColor: "#eee" },
	title: { fontWeight: "700", color: "#111827" },
	sub: { fontSize: 12, color: "#6B7280", marginTop: 4 },
	price: { fontWeight: "700", color: "#10B981" },
	distance: { fontSize: 12, color: "#6B7280" },
});
