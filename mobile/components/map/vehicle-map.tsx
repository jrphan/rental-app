import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

export type Cluster = {
	id: string;
	latitude: number;
	longitude: number;
	count: number;
	vehicles: any[];
};

interface Props {
	clusters: Cluster[];
	initialRegion?: {
		latitude: number;
		longitude: number;
		latitudeDelta?: number;
		longitudeDelta?: number;
	};
	selectedClusterId?: string | null;
	onSelectCluster?: (clusterId: string | null) => void;
}

export function VehicleMap({ clusters, initialRegion, selectedClusterId, onSelectCluster }: Props) {
	const mapRef = useRef<MapView | null>(null);

	const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status === "granted") {
					const pos = await Location.getCurrentPositionAsync({});
					setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
				}
			} catch (e) {
				// ignore silently — map still works without user location
			}
		})();
	}, []);

	useEffect(() => {
		if (selectedClusterId && mapRef.current) {
			const c = clusters.find((x) => x.id === selectedClusterId);
			if (c) {
				mapRef.current.animateToRegion(
					{
						latitude: c.latitude,
						longitude: c.longitude,
						latitudeDelta: 0.012,
						longitudeDelta: 0.012,
					},
					300
				);
			}
		}
	}, [selectedClusterId, clusters]);

	return (
		<MapView
			ref={mapRef}
			provider={PROVIDER_GOOGLE}
			style={{ flex: 1 }}
			showsUserLocation={true}
			initialRegion={
				initialRegion
					? {
							latitude: initialRegion.latitude,
							longitude: initialRegion.longitude,
							latitudeDelta: initialRegion.latitudeDelta ?? 0.05,
							longitudeDelta: initialRegion.longitudeDelta ?? 0.05,
					  }
					: {
							latitude: clusters[0]?.latitude ?? 10.7769,
							longitude: clusters[0]?.longitude ?? 106.70098,
							latitudeDelta: 0.05,
							longitudeDelta: 0.05,
					  }
			}
		>
			{/* show user location marker & small accuracy circle if available */}
			{userLocation && (
				<>
					<Marker
						coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
						key="__user_location_marker"
						identifier="user-location"
					>
						<View style={styles.userMarker} />
					</Marker>
					<Circle
						center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
						radius={40}
						strokeColor="rgba(59,130,246,0.2)"
						fillColor="rgba(59,130,246,0.08)"
					/>
				</>
			)}
			{clusters.map((c) => (
				<Marker
					key={c.id}
					coordinate={{ latitude: c.latitude, longitude: c.longitude }}
					onPress={() => onSelectCluster?.(c.id)}
				>
					<View style={styles.marker}>
						<Text style={styles.markerText}>{c.count} xe</Text>
					</View>
				</Marker>
			))}
		</MapView>
	);
}

const styles = StyleSheet.create({
	marker: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderWidth: 1,
		borderColor: "#FF6B35",
		minWidth: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	markerText: {
		color: "#FF6B35",
		fontWeight: "700",
	},
	userMarker: {
		width: 14,
		height: 14,
		borderRadius: 14,
		backgroundColor: "#3B82F6",
		borderWidth: 3,
		borderColor: "#fff",
	},
});
