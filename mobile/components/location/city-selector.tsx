import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Input } from "@/components/ui/input";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { normalize } from "@/lib/utils";

type City = { id: number; name: string; province?: string };

type CitySelectorProps = {
	cities: City[];
	selectedCityId?: number | null;
	onSelect: (city: City) => void;
	placeholder?: string;
	maxHeight?: number;
};

export default function CitySelector({
	cities,
	selectedCityId,
	onSelect,
	placeholder = "Tìm thành phố...",
	maxHeight = 200,
}: CitySelectorProps) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = normalize(query || "");
		if (!q) return cities;
		return cities.filter((c) => {
			return (
				normalize(c.name || "").includes(q) ||
				normalize(c.province || "").includes(q) ||
				normalize(String(c.id) || "").includes(q)
			);
		});
	}, [cities, query]);

	return (
		<View>
			<Input
				placeholder={placeholder}
				value={query}
				onChangeText={(t) => setQuery(t)}
				style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 10 }}
			/>

			<ScrollView style={{ maxHeight }}>
				{cities.length > 0 ? (
					filtered.map((c) => {
						const isSelected = selectedCityId === c.id;
						return (
							<TouchableOpacity
								key={c.id}
								onPress={() => onSelect(c)}
								style={{
									paddingVertical: 10,
									paddingHorizontal: 8,
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									backgroundColor: isSelected ? "#FEF3C7" : "transparent",
									borderRadius: 6,
								}}
								className={`py-3 px-4 rounded-xl mb-2 border ${
									isSelected ? "border-orange-500" : "border-gray-200"
								}`}
								activeOpacity={0.7}
							>
								<View className="flex-row items-center">
									<MaterialIcons name="location-city" size={24} color="#EA580C" />
									<Text className="ml-3 text-lg font-semibold text-gray-900">{c.name}</Text>
									{isSelected && <MaterialIcons name="check" size={20} color="#EA580C" />}
								</View>
							</TouchableOpacity>
						);
					})
				) : (
					<Text className="text-gray-500">Không có danh sách thành phố</Text>
				)}
			</ScrollView>
		</View>
	);
}
