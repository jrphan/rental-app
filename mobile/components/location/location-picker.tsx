import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useToast } from "@/lib/toast";
import { fetchGoogleReverseGeocode } from "@/lib/geocode";

export type PickedPlace = {
	display: string;
	lat?: number;
	lng?: number;
	cityId?: string;
};

export function LocationPicker({
	visible,
	onClose,
	onPick,
	cities = [],
}: {
	visible: boolean;
	onClose: () => void;
	onPick: (p: PickedPlace) => void;
	cities?: any[];
}) {
	const toast = useToast();
	const placesRef = useRef<any>(null);
	const [inputText, setInputText] = useState("");

	// Ensure internal GP input cleared whenever modal opens/closes
	useEffect(() => {
		// small delay to ensure ref exists on open
		if (visible) {
			setTimeout(() => {
				setInputText("");
				try {
					placesRef.current?.setAddressText("");
				} catch {}
			}, 0);
		} else {
			// on close clear both states so renderRightButton won't show
			setInputText("");
			try {
				placesRef.current?.setAddressText("");
			} catch {}
		}
	}, [visible]);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
				<View
					style={{
						backgroundColor: "#fff",
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						padding: 16,
						minHeight: "80%",
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
						<Text style={{ fontSize: 16, fontWeight: "600" }}>Nhập địa chỉ *</Text>
						<TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
							<MaterialIcons name="close" size={20} color="#6B7280" />
						</TouchableOpacity>
					</View>

					<GooglePlacesAutocomplete
						ref={placesRef}
						placeholder="Nhập địa chỉ hoặc tên địa điểm"
						fetchDetails
						minLength={2}
						debounce={300}
						nearbyPlacesAPI="GooglePlacesSearch"
						onPress={(data: any, details: any = null) => {
							const display =
								details?.formatted_address ||
								data.description ||
								data.structured_formatting?.main_text ||
								data.description;
							const lat = details?.geometry?.location?.lat;
							const lng = details?.geometry?.location?.lng;
							let cityId: string | undefined = undefined;
							const comps = details?.address_components || [];
							const cityComp =
								comps.find((c: any) => c.types?.includes("administrative_area_level_1")) ||
								comps.find((c: any) => c.types?.includes("locality")) ||
								null;
							if (cityComp?.long_name) {
								const matched = (cities || []).find(
									(c: any) =>
										String(c.name).toLowerCase() === String(cityComp.long_name).toLowerCase()
								);
								if (matched) cityId = matched.id;
							}
							onPick({ display, lat: Number(lat), lng: Number(lng), cityId });

							// clear internal input and local state to remove 'x' icon
							setInputText("");
							try {
								placesRef.current?.setAddressText("");
							} catch {}
						}}
						query={{
							key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
							language: "vi",
							components: "country:vn",
						}}
						textInputProps={{
							placeholderTextColor: "#9CA3AF",
							clearButtonMode: "while-editing",
							onChangeText: (t: string) => setInputText(t),
							value: inputText, // bind value to local state so we control it
						}}
						styles={{
							container: { flex: 0 },
							textInputContainer: {
								backgroundColor: "#fff",
								borderRadius: 8,
								borderWidth: 1,
								borderColor: "#E5E7EB",
								marginBottom: 8,
								paddingHorizontal: 6,
							},
							textInput: { height: 44, color: "#000", fontSize: 16, paddingHorizontal: 12 },
							listView: { backgroundColor: "#fff", maxHeight: 300 },
						}}
						renderLeftButton={() => (
							<View style={{ justifyContent: "center", paddingLeft: 8 }}>
								<MaterialIcons name="location-on" size={20} color="#EA580C" />
							</View>
						)}
						renderRightButton={() =>
							inputText ? (
								<TouchableOpacity
									onPress={() => {
										setInputText("");
										try {
											placesRef.current?.setAddressText("");
										} catch {}
									}}
									style={{ paddingHorizontal: 8, justifyContent: "center" }}
								>
									<View style={{ backgroundColor: "#E6F4EA", borderRadius: 16, padding: 4 }}>
										<MaterialIcons name="close" size={16} color="#059669" />
									</View>
								</TouchableOpacity>
							) : null
						}
						renderRow={(rowData: any) => {
							const main = rowData.structured_formatting?.main_text || rowData.description;
							const secondary = rowData.structured_formatting?.secondary_text || "";
							return (
								<View
									style={{
										flexDirection: "row",
										alignItems: "center",
										paddingVertical: 12,
										paddingHorizontal: 8,
									}}
								>
									<MaterialIcons
										name="location-on"
										size={20}
										color="#EA580C"
										style={{ marginRight: 12 }}
									/>
									<View style={{ flex: 1 }}>
										<Text style={{ fontWeight: "700", fontSize: 16 }}>{main}</Text>
										{secondary ? (
											<Text style={{ color: "#6B7280", marginTop: 4 }}>{secondary}</Text>
										) : null}
									</View>
								</View>
							);
						}}
						enablePoweredByContainer={false}
					/>

					<TouchableOpacity
						style={{
							paddingVertical: 12,
							paddingHorizontal: 10,
							borderRadius: 12,
							borderWidth: 1,
							borderColor: "#E5E7EB",
							backgroundColor: "#F8FAFC",
							flexDirection: "row",
							alignItems: "center",
							marginTop: 8,
						}}
						onPress={async () => {
							try {
								const { status } = await Location.requestForegroundPermissionsAsync();
								if (status !== "granted") {
									toast.showError("Vui lòng cấp quyền vị trí để sử dụng tính năng này");
									return;
								}
								const pos = await Location.getCurrentPositionAsync({
									accuracy: Location.Accuracy.Highest,
								});
								const geo = await fetchGoogleReverseGeocode(pos.coords.latitude, pos.coords.longitude);
								let display = "Vị trí hiện tại";
								let cityId: string | undefined = undefined;
								if (geo) {
									display = geo.formatted_address || display;
									const comps = geo.address_components || [];
									const cityComp =
										comps.find((c: any) => c.types?.includes("administrative_area_level_1")) ||
										comps.find((c: any) => c.types?.includes("locality")) ||
										null;
									if (cityComp?.long_name) {
										const matched = (cities || []).find(
											(c: any) =>
												String(c.name).toLowerCase() ===
												String(cityComp.long_name).toLowerCase()
										);
										if (matched) cityId = matched.id;
									}
								}
								onPick({ display, lat: pos.coords.latitude, lng: pos.coords.longitude, cityId });
								onClose();
							} catch (e) {
								toast.showError("Không thể lấy vị trí hiện tại");
							}
						}}
					>
						<MaterialIcons name="my-location" size={20} color="#EA580C" />
						<Text style={{ marginLeft: 12, fontWeight: "600", fontSize: 16 }}>Vị trí hiện tại</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}
