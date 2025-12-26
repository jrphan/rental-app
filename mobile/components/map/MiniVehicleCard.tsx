import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import type { Vehicle } from "@/screens/vehicles/types";
import { formatPrice } from "@/screens/vehicles/utils";

interface Props {
	vehicle: Vehicle;
	distanceKm?: number;
	onPress: () => void;
}

export default function MiniVehicleCard({ vehicle, distanceKm, onPress }: Props) {
	const img = vehicle.images && vehicle.images.length ? vehicle.images[0].url : undefined;
	return (
		<TouchableOpacity onPress={onPress} style={styles.card}>
			<Image source={{ uri: img }} style={styles.image} />
			<View style={{ flex: 1, paddingLeft: 8 }}>
				<Text numberOfLines={1} style={styles.title}>
					{vehicle.brand} {vehicle.model}
				</Text>
				<Text numberOfLines={1} style={styles.sub}>
					{vehicle.ward ? `${vehicle.ward}, ${vehicle.district}` : vehicle.district || "-"}
				</Text>
				<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
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
	sub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
	price: { fontWeight: "700", color: "#10B981" },
	distance: { fontSize: 12, color: "#6B7280" },
});
