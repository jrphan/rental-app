import { useState, useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { parseAddressPartsFromGoogleResult, reverseGeocode } from "@/components/location/addressUtils";

interface MapPickerModalProps {
	visible: boolean;
	onClose: () => void;
	onSelect: (
		lat: string,
		lng: string,
		addressParts?: {
			address?: string; // street
			fullAddress?: string; // full formatted
			ward?: string;
			district?: string;
			city?: string;
		}
	) => void;
	initialLat?: string;
	initialLng?: string;
}

export default function MapPickerModal({ visible, onClose, onSelect, initialLat, initialLng }: MapPickerModalProps) {
	// Helper to get safe region values
	const getSafeRegion = (lat?: string, lng?: string): Region => {
		const defaultLat = 10.762622; // HCM
		const defaultLng = 106.660172;

		const parsedLat = lat ? parseFloat(lat) : defaultLat;
		const parsedLng = lng ? parseFloat(lng) : defaultLng;

		return {
			latitude: isFinite(parsedLat) ? parsedLat : defaultLat,
			longitude: isFinite(parsedLng) ? parsedLng : defaultLng,
			latitudeDelta: 0.01,
			longitudeDelta: 0.01,
		};
	};

	const [region, setRegion] = useState<Region>(getSafeRegion(initialLat, initialLng));
	const [selectedLocation, setSelectedLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(
		initialLat && initialLng
			? {
				lat: parseFloat(initialLat),
				lng: parseFloat(initialLng),
			}
			: null
	);
	const [isLoadingLocation, setIsLoadingLocation] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const [selectedAddressParts, setSelectedAddressParts] = useState<{
		address?: string;
		fullAddress?: string;
		ward?: string;
		district?: string;
		city?: string;
	} | null>(null);

	const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

	// Update region when initial values change
	useEffect(() => {
		if (initialLat && initialLng) {
			const newRegion = getSafeRegion(initialLat, initialLng);
			setRegion(newRegion);
		}
	}, [initialLat, initialLng]);

	// Try to get current location when modal opens
	useEffect(() => {
		if (visible && !initialLat && !initialLng) {
			getCurrentLocation();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible]);

	// ref để clear input
	const placesRef = useRef<any>(null);
	const mapRef = useRef<MapView | null>(null);

	// helper to set selected parts after Google result
	const applyGoogleResult = (formatted: string | undefined, components: any[] | undefined, geometry?: any) => {
		const parts = parseAddressPartsFromGoogleResult(formatted, components);
		setSelectedAddressParts({
			address: parts.address,
			fullAddress: parts.fullAddress,
			ward: parts.ward,
			district: parts.district,
			city: parts.city,
		});
		setSearchQuery(parts.address || "");
		if (geometry) {
			const loc = geometry.location;
			const newRegion = {
				latitude: loc.lat,
				longitude: loc.lng,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};
			setRegion(newRegion);
			setSelectedLocation({ lat: loc.lat, lng: loc.lng });
			// Animate map to new region
			mapRef.current?.animateToRegion(newRegion, 500);
		}
	};

	const setAddressPartsFromGeocodeResult = (
		parsedResult: ReturnType<typeof parseAddressPartsFromGoogleResult> | null
	) => {
		if (!parsedResult) return;
		setSelectedAddressParts({
			address: parsedResult.address,
			fullAddress: parsedResult.fullAddress,
			ward: parsedResult.ward,
			district: parsedResult.district,
			city: parsedResult.city,
		});
		// setSearchQuery(parsedResult.fullAddress || parsedResult.address || "");
	};

	const getCurrentLocation = async () => {
		try {
			setIsLoadingLocation(true);
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				return;
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Highest,
			});

			const newRegion = {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};

			setRegion(newRegion);
			setSelectedLocation({
				lat: location.coords.latitude,
				lng: location.coords.longitude,
			});
			// Animate map to new region
			mapRef.current?.animateToRegion(newRegion, 500);

			// Use Google reverse geocode for consistent address components
			if (API_KEY) {
				try {
					const parts = await reverseGeocode(location.coords.latitude, location.coords.longitude, API_KEY);
					if (parts) {
						setAddressPartsFromGeocodeResult(parts as any);
					}
				} catch (err) {
					console.warn("Google reverse geocode failed:", err);
				}
			}
		} catch (error) {
			console.error("Error getting location:", error);
		} finally {
			setIsLoadingLocation(false);
		}
	};

	const handleMapPress = (event: any) => {
		const { latitude, longitude } = event.nativeEvent.coordinate;
		setSelectedLocation({ lat: latitude, lng: longitude });

		(async () => {
			if (!API_KEY) return;
			const parts = await reverseGeocode(latitude, longitude, API_KEY);
			if (parts) setAddressPartsFromGeocodeResult(parts as any);
		})();
	};

	const handleConfirm = () => {
		setSearchQuery("");
		if (selectedLocation) {
			onSelect(
				selectedLocation.lat.toString(),
				selectedLocation.lng.toString(),
				selectedAddressParts || undefined
			);
			onClose();
		}
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<MaterialIcons name="close" size={24} color="#000" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Chọn vị trí trên bản đồ</Text>
					<TouchableOpacity
						onPress={getCurrentLocation}
						disabled={isLoadingLocation}
						style={styles.locationButton}
					>
						{isLoadingLocation ? (
							<ActivityIndicator size="small" color={COLORS.primary} />
						) : (
							<MaterialIcons name="my-location" size={24} color={COLORS.primary} />
						)}
					</TouchableOpacity>
				</View>

				{/* Search Bar - using GooglePlacesAutocomplete */}
				<View style={styles.searchContainer}>
					<GooglePlacesAutocomplete
						ref={placesRef}
						placeholder="Tìm kiếm địa chỉ hoặc tên địa điểm"
						fetchDetails={true}
						onPress={(data, details = null) => {
							const result = details || (data as any);
							const formatted =
								(result.formatted_address as string) ||
								data.description ||
								data.structured_formatting?.main_text;
							const components = (result.address_components as any[]) || [];
							applyGoogleResult(formatted, components, result.geometry);
							// keep input text but close the dropdown (component handles it)
						}}
						query={{
							key: API_KEY || "",
							language: "vi",
							components: "country:vn",
						}}
						textInputProps={{
							placeholderTextColor: "#9CA3AF",
							clearButtonMode: "while-editing",
							onChangeText: (text) => {
								setSearchQuery(text);
							},
						}}
						styles={{
							textInputContainer: {
								backgroundColor: "#fff",
								borderTopWidth: 0,
								borderBottomWidth: 0,
								paddingHorizontal: 0,
								borderRadius: 12,
							},
							textInput: {
								height: 44,
								color: "#111827",
								fontSize: 14,
								// borderWidth: 1,
								// borderColor: "#E5E7EB",
								borderRadius: 12,
								paddingHorizontal: 12,
								backgroundColor: "#fff",
							},
							listView: {
								backgroundColor: "#fff",
								borderRadius: 12,
								elevation: 3,
								marginTop: 8,
								maxHeight: 200,
							},
							description: { color: "#6B7280" },
						}}
						renderRow={(rowData) => {
							const main = rowData.structured_formatting?.main_text || rowData.description;
							const second = rowData.structured_formatting?.secondary_text || "";
							return (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										// padding: 12,
										// borderBottomColor: "#F3F4F6",
										// borderBottomWidth: 1,
									}}
								>
									<MaterialIcons
										name="place"
										size={20}
										color={COLORS.primary}
										style={{ marginRight: 12 }}
									/>
									<View style={{ flex: 1 }}>
										<Text style={{ fontWeight: "700", color: "#111827" }} numberOfLines={1}>
											{main}
										</Text>
										{second ? (
											<Text style={{ color: "#6B7280", marginTop: 2 }} numberOfLines={1}>
												{second}
											</Text>
										) : null}
									</View>
								</View>
							);
						}}
						renderLeftButton={() => (
							<View style={{ marginLeft: 8, justifyContent: "center" }}>
								<MaterialIcons name="search" size={20} color="#6B7280" />
							</View>
						)}
						renderRightButton={() =>
							searchQuery ? (
								<TouchableOpacity
									onPress={() => {
										placesRef.current?.setAddressText?.("");
										setSelectedAddressParts(null);
										setSelectedLocation(null);
										setSearchQuery("");
									}}
									style={{ marginRight: 8, justifyContent: "center" }}
								>
									<MaterialIcons name="close" size={20} color="#6B7280" />
								</TouchableOpacity>
							) : null
						}
						enablePoweredByContainer={false}
						nearbyPlacesAPI="GooglePlacesSearch"
						minLength={2}
						debounce={300}
					/>
				</View>

				{/* Map */}
				<MapView
					ref={mapRef}
					style={styles.map}
					initialRegion={region}
					onRegionChangeComplete={setRegion}
					onPress={handleMapPress}
					showsUserLocation={true}
					showsMyLocationButton={false}
					provider="google"
					onMapReady={() => {
						// Map is ready
						console.log("MapView ready");
					}}
				>
					{selectedLocation && (
						<Marker
							coordinate={{
								latitude: selectedLocation.lat,
								longitude: selectedLocation.lng,
							}}
							pinColor={COLORS.primary}
						/>
					)}
				</MapView>

				{/* Info and Confirm Button */}
				<View style={styles.footer}>
					{selectedLocation ? (
						<View style={styles.infoContainer}>
							<Text style={styles.infoText}>Vị trí đã chọn:</Text>
							<Text style={styles.coordinateText}>
								{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
							</Text>
							{selectedAddressParts?.fullAddress ? (
								<Text style={{ marginTop: 6, color: "#374151" }}>{selectedAddressParts.fullAddress}</Text>
							) : null}
						</View>
					) : (
						<Text style={styles.hintText}>👆 Chạm vào bản đồ để chọn vị trí</Text>
					)}
					<TouchableOpacity
						onPress={handleConfirm}
						disabled={!selectedLocation}
						style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
					>
						<Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
		backgroundColor: "#fff",
	},
	closeButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	locationButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	searchContainer: {
		position: "absolute",
		top: 60,
		left: 0,
		right: 0,
		zIndex: 1000,
		paddingHorizontal: 16,
	},
	searchInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		gap: 8,
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: "#111827",
		paddingVertical: 4,
	},
	searchResultsContainer: {
		marginTop: 8,
		backgroundColor: "#fff",
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
		maxHeight: 200,
	},
	searchResultsList: {
		maxHeight: 200,
	},
	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
		gap: 12,
	},
	searchResultTextContainer: {
		flex: 1,
	},
	searchResultText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#111827",
		marginBottom: 2,
	},
	searchResultSubtext: {
		fontSize: 12,
		color: "#6B7280",
	},
	map: {
		flex: 1,
	},
	footer: {
		padding: 16,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
	},
	infoContainer: {
		marginBottom: 12,
	},
	infoText: {
		fontSize: 12,
		color: "#6B7280",
		marginBottom: 4,
	},
	coordinateText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#111827",
		fontFamily: "monospace",
	},
	hintText: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		marginBottom: 12,
	},
	confirmButton: {
		backgroundColor: COLORS.primary,
		paddingVertical: 14,
		borderRadius: 12,
		alignItems: "center",
	},
	confirmButtonDisabled: {
		backgroundColor: "#D1D5DB",
	},
	confirmButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
