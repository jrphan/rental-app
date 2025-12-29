import { Linking, Platform } from "react-native";

/**
 * Open external maps app to get directions to (lat,lng).
 * Uses Apple Maps on iOS, Google Maps web on Android as fallback.
 */
export function openExternalMaps(destLat: number, destLng: number, label?: string) {
	const appleUrl = `http://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d`;
	const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
	const geoUrl = `geo:${destLat},${destLng}?q=${encodeURIComponent(label || `${destLat},${destLng}`)}`;

	if (Platform.OS === "ios") {
		Linking.openURL(appleUrl).catch(() => Linking.openURL(googleUrl).catch(() => Linking.openURL(geoUrl)));
	} else {
		Linking.openURL(googleUrl).catch(() => Linking.openURL(geoUrl));
	}
}
