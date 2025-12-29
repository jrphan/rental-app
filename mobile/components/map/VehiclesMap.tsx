import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import type { Vehicle } from "@/screens/vehicles/types";
import MiniVehicleCard from "./MiniVehicleCard";
import { calculateDistanceKm } from "@/lib/geo";

interface VehiclesMapProps {
	vehicles: Vehicle[];
	initialLat?: number;
	initialLng?: number;
	fullScreen?: boolean;
	viewVehicleLocation?: boolean;
	onToggleFullScreen?: () => void;
}

export default function VehiclesMap({
	vehicles,
	initialLat,
	initialLng,
	fullScreen = false,
	viewVehicleLocation = false,
	onToggleFullScreen,
}: VehiclesMapProps) {
	const router = useRouter();
	const mapRef = useRef<MapView | null>(null);
	const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

	// Simple grid clustering by rounding to 2 decimals (~1km)
	const clusters = useMemo(() => {
		const m = new Map<string, { lat: number; lng: number; items: Vehicle[] }>();
		vehicles.forEach((v) => {
			if (v.lat == null || v.lng == null) return;
			const key = `${(Math.round(Number(v.lat) * 100) / 100).toFixed(2)}_${(Math.round(Number(v.lng) * 100) / 100).toFixed(2)}`;
			if (!m.has(key)) m.set(key, { lat: Number(v.lat), lng: Number(v.lng), items: [] });
			m.get(key)!.items.push(v);
		});
		return Array.from(m.values());
	}, [vehicles]);

	const initialRegion = {
		latitude: initialLat ?? clusters[0]?.lat ?? 10.762622,
		longitude: initialLng ?? clusters[0]?.lng ?? 106.660172,
		latitudeDelta: 0.03,
		longitudeDelta: 0.03,
	};

	const onMarkerPress = (index: number) => {
		const c = clusters[index];
		setSelectedCluster(index);
		mapRef.current?.animateToRegion(
			{
				latitude: c.lat,
				longitude: c.lng,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			},
			300
		);
	};

	const containerStyle = fullScreen
		? { flex: 1 }
		: {
				height: Dimensions.get("window").height * (viewVehicleLocation ? 0.2 : 0.5),
				borderRadius: 16,
				overflow: "hidden",
			};

	return (
		<View style={containerStyle}>
			<MapView
				ref={(r) => (mapRef.current = r)}
				style={StyleSheet.absoluteFill}
				initialRegion={initialRegion}
				showsUserLocation
			>
				{!viewVehicleLocation &&
					clusters.map((c, idx) => (
						<Marker
							key={`${c.lat}-${c.lng}-${idx}`}
							coordinate={{ latitude: c.lat, longitude: c.lng }}
							onPress={() => onMarkerPress(idx)}
						>
							<View style={styles.clusterMarker}>
								<Text style={styles.clusterText}>{c.items.length}</Text>
								<Text style={styles.clusterEmoji}>🏍️</Text>
							</View>
						</Marker>
					))}
				<Marker
					coordinate={{
						latitude: initialLat,
						longitude: initialLng,
					}}
					pinColor={COLORS.primary}
				/>
			</MapView>

			{/* Zoom / Fullscreen toggle button (top-right) */}
			<TouchableOpacity
				style={viewVehicleLocation && fullScreen ? [styles.fullscreenBtn, { top: 60 }] : styles.fullscreenBtn}
				onPress={() => onToggleFullScreen && onToggleFullScreen()}
				activeOpacity={0.8}
			>
				<MaterialIcons name={fullScreen ? "zoom-in-map" : "zoom-out-map"} size={20} color="#111827" />
			</TouchableOpacity>

			{/* Bottom mini list overlay when cluster selected */}
			{selectedCluster != null && clusters[selectedCluster] && (
				<View style={styles.bottomContainer}>
					<FlatList
						horizontal
						showsHorizontalScrollIndicator={false}
						data={clusters[selectedCluster].items}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => {
							const refLat = initialLat;
							const refLng = initialLng;
							const distance =
								refLat && refLng && item.lat != null && item.lng != null
									? Number(
											calculateDistanceKm(
												refLat,
												refLng,
												Number(item.lat),
												Number(item.lng)
											).toFixed(1)
										)
									: undefined;
							return (
								<MiniVehicleCard
									vehicle={item}
									distanceKm={distance}
									onPress={() => router.push(`/vehicle/${item.id}`)}
								/>
							);
						}}
						contentContainerStyle={{ paddingHorizontal: 12 }}
					/>
					<View style={{ position: "absolute", right: 12, top: -28 }}>
						<TouchableOpacity onPress={() => setSelectedCluster(null)} style={styles.closeBtn}>
							<MaterialIcons name="close" size={18} color="#fff" />
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	clusterMarker: {
		backgroundColor: "#fff",
		paddingHorizontal: 5,
		paddingVertical: 3,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#eee",
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
	},
	clusterText: { fontWeight: "700", color: "#111827" },
	clusterEmoji: { fontSize: 10, color: COLORS.primary, marginBottom: 4 },
	bottomContainer: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 27,
		paddingVertical: 8,
	},
	closeBtn: {
		backgroundColor: "#111827AA",
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	fullscreenBtn: {
		position: "absolute",
		top: 12,
		left: 12,
		backgroundColor: "#fff",
		opacity: 0.6,
		padding: 9,
		borderRadius: 24,
	},
});
