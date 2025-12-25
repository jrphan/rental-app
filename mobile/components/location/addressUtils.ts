export function parseGoogleAddressComponents(components: any[] = []) {
	const map: Record<string, string> = {};
	(components || []).forEach((c: any) => {
		(c.types || []).forEach((t: string) => {
			map[t] = c.long_name;
		});
	});

	const ward = map["sublocality_level_1"] || map["sublocality"] || map["neighborhood"] || map["political"] || "";
	const district = map["administrative_area_level_2"] || map["administrative_area_level_3"] || map["locality"] || "";
	let city = map["administrative_area_level_1"] || map["administrative_area_level_2"] || map["country"] || "";

	const normalizeCity = (s: string) =>
		(s || "")
			.replace(/^Thành phố\s+/i, "")
			.replace(/^TP[\.\s]+/i, "")
			.replace(/^Tỉnh\s+/i, "")
			.replace(/^Thị xã\s+/i, "")
			.trim();

	city = normalizeCity(city);

	const street = [map["street_number"], map["route"], map["premise"]].filter(Boolean).join(" ");

	return { ward, district, city, street, raw: map };
}

export function extractWardFromFormatted(formatted?: string) {
	if (!formatted) return "";
	const parts = formatted.split(",").map((p) => p.trim());
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		const m = p.match(/(Phường|P\.|P|Xã|X\.|Thị trấn|TT)\s*\.?\s*(.+)/i);
		if (m) return p;
		if (/^(Phường|Xã|Thị trấn|P\.|TT)\b/i.test(p)) return p;
	}
	if (parts.length >= 2 && parts[1].length < 40) return parts[1];
	return "";
}

export function parseAddressPartsFromGoogleResult(formatted: string | undefined, components: any[] | undefined) {
	const parsed = parseGoogleAddressComponents(components || []);
	const wardFromFormatted = extractWardFromFormatted(formatted);
	// const ward = parsed.ward || wardFromFormatted || "";
	const ward = wardFromFormatted || "";
	// street: prefer parsed street or first token of formatted
	const streetFromFormatted = formatted ? formatted.split(",")[0].trim() : "";
	const street = parsed.street || streetFromFormatted || "";
	const fullAddress = formatted || "";
	return {
		fullAddress,
		address: street, // street only
		ward,
		district: parsed.district,
		city: parsed.city,
		raw: parsed.raw,
	};
}

/**
 * Reverse geocode helper (reuse across MapPickerModal + LocationPicker)
 */
export async function reverseGeocode(lat: number | string, lng: number | string, apiKey?: string) {
	apiKey = apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
	if (!apiKey) return null;
	try {
		const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=vi`;
		const resp = await fetch(url);
		const json = await resp.json();
		const res = Array.isArray(json.results) && json.results[0];
		if (!res) return null;
		const parts = parseAddressPartsFromGoogleResult(res.formatted_address, res.address_components);
		return parts;
	} catch (err) {
		console.warn("reverseGeocode error:", err);
		return null;
	}
}
