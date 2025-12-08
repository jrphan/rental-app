export async function fetchGoogleReverseGeocode(lat: number, lng: number) {
	// trả về object result (giống Google Geocode API result) hoặc null
	try {
		const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
		if (!key) return null;
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=vi&key=${encodeURIComponent(
			key
		)}`;
		const res = await fetch(url);
		const json = await res.json();
		if (!json?.results || json.results.length === 0) return null;
		const preferred = ["street_address", "premise", "subpremise", "route", "establishment", "point_of_interest"];
		const found = json.results.find((r: any) => r.types?.some((t: string) => preferred.includes(t)));
		return found || json.results[0];
	} catch (err) {
		console.warn("reverseGeocode fail", err);
		return null;
	}
}
/**
 * Returns distance in kilometers between two lat/lng pairs using Haversine.
 */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371; // Earth radius km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}
