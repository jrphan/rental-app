import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MapPickerModal from "@/components/location/MapPickerModal";
import { Select } from "@/components/ui/select";
import { COLORS } from "@/constants/colors";
import { VEHICLE_TYPES } from "@/constants/vehicle.constants";

export type SearchFilters = {
	lat?: number;
	lng?: number;
	radius?: number;
	locationLabel?: string;
	types?: string[]; // vehicle types
	minPrice?: number | null;
	maxPrice?: number | null;
	sortBy?: "price_asc" | "price_desc" | "distance_asc" | "distance_desc" | "rating_desc" | null;
};

interface FilterModalProps {
	visible: boolean;
	initial?: SearchFilters;
	onClose: () => void;
	onApply: (filters: SearchFilters) => void;
}

export default function FilterModal({ visible, initial, onClose, onApply }: FilterModalProps) {
	const [showMapPicker, setShowMapPicker] = useState(false);
	const [showSortModal, setShowSortModal] = useState(false);
	const [filters, setFilters] = useState<SearchFilters>(initial || {});
	useEffect(() => {
		setFilters(initial || {});
	}, [initial, visible]);

	const toggleType = (type: string) => {
		const set = new Set(filters.types || []);
		if (set.has(type)) set.delete(type);
		else set.add(type);
		setFilters({ ...filters, types: Array.from(set) });
	};

	const reset = () => {
		setFilters({});
	};

	const apply = () => {
		onApply(filters);
		onClose();
	};

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
			<View style={{ flex: 1, backgroundColor: "#F3F4F6", padding: 16 }}>
				{/* Header */}
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 18,
						marginTop: 36,
					}}
				>
					<View style={{ width: 40 }}>
						<TouchableOpacity
							onPress={onClose}
							style={{
								width: 36,
								height: 36,
								borderRadius: 18,
								backgroundColor: "#fff",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<MaterialIcons name="close" size={20} color="#111827" />
						</TouchableOpacity>
					</View>
					<Text style={{ fontSize: 18, fontWeight: "700" }}>Bộ lọc</Text>
					<View style={{ width: 40 }} />
				</View>

				<ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
					{/* Location Picker */}
					<View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 18, marginBottom: 18 }}>
						<Text style={{ fontWeight: "600", marginBottom: 8 }}>Chọn địa điểm</Text>
						{filters.locationLabel ? (
							<View
								style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
							>
								<Text style={{ flex: 1 }}>{filters.locationLabel}</Text>
								<TouchableOpacity
									onPress={() =>
										setFilters({
											...filters,
											lat: undefined,
											lng: undefined,
											radius: undefined,
											locationLabel: undefined,
										})
									}
								>
									<Text style={{ color: COLORS.primary }}>Xóa</Text>
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								onPress={() => setShowMapPicker(true)}
								style={{ padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" }}
							>
								<Text style={{ color: "#6B7280" }}>Chọn vị trí trên bản đồ</Text>
							</TouchableOpacity>
						)}
					</View>

					{/* Types */}
					<View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 18, marginBottom: 18 }}>
						<Text style={{ fontWeight: "600", marginBottom: 8 }}>Loại xe</Text>
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
							{VEHICLE_TYPES.map((t) => {
								const selected = (filters.types || []).includes(t.value);
								return (
									<TouchableOpacity
										key={t.value}
										onPress={() => toggleType(t.value)}
										style={{
											paddingHorizontal: 12,
											paddingVertical: 8,
											borderRadius: 999,
											borderWidth: 1,
											borderColor: selected ? COLORS.primary : "#E5E7EB",
											backgroundColor: selected ? "#FFF7ED" : "#fff",
											marginRight: 8,
											marginBottom: 8,
										}}
									>
										<Text style={{ color: selected ? COLORS.primary : "#111827" }}>{t.label}</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					{/* Price range */}
					<View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 18, marginBottom: 18 }}>
						<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
							<Text style={{ fontWeight: "600" }}>Khoảng giá (VNĐ/ngày)</Text>
							<TouchableOpacity
								onPress={() => setFilters({ ...filters, minPrice: undefined, maxPrice: undefined })}
							>
								<Text style={{ color: COLORS.primary }}>Xóa</Text>
							</TouchableOpacity>
						</View>
						<View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
							<TextInput
								keyboardType="numeric"
								placeholder="Min"
                                placeholderTextColor="#9CA3AF"
								value={filters.minPrice?.toString() || ""}
								onChangeText={(v) => setFilters({ ...filters, minPrice: v ? Number(v) : undefined })}
								style={{
									flex: 1,
									borderWidth: 1,
									borderColor: "#E5E7EB",
									borderRadius: 8,
									padding: 8,
									backgroundColor: "#fff",
								}}
							/>
							<TextInput
								keyboardType="numeric"
								placeholder="Max"
                                placeholderTextColor="#9CA3AF"
								value={filters.maxPrice?.toString() || ""}
								onChangeText={(v) => setFilters({ ...filters, maxPrice: v ? Number(v) : undefined })}
								style={{
									flex: 1,
									borderWidth: 1,
									borderColor: "#E5E7EB",
									borderRadius: 8,
									padding: 8,
									backgroundColor: "#fff",
								}}
							/>
						</View>
					</View>

					{/* Sort - compact selector that opens small modal */}
					<View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 18, marginBottom: 12 }}>
						<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
							<Text style={{ fontWeight: "600" }}>Sắp xếp theo</Text>
							<TouchableOpacity onPress={() => setFilters({ ...filters, sortBy: undefined })}>
								<Text style={{ color: COLORS.primary }}>Xóa</Text>
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							onPress={() => setShowSortModal(true)}
							style={{ paddingVertical: 12, marginTop: 8 }}
						>
							<Text style={{ color: "#111827" }}>
								{filters.sortBy === "price_asc"
									? "Giá tăng dần"
									: filters.sortBy === "price_desc"
										? "Giá giảm dần"
										: filters.sortBy === "distance_asc"
											? "Khoảng cách gần nhất"
											: filters.sortBy === "distance_desc"
												? "Khoảng cách xa nhất"
												: filters.sortBy === "rating_desc"
													? "Đánh giá tốt nhất"
													: "Mặc định"}
							</Text>
						</TouchableOpacity>
						{/* small sort modal */}
						<Modal
							visible={showSortModal}
							transparent
							animationType="slide"
							onRequestClose={() => setShowSortModal(false)}
						>
							<View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
								<View
									style={{
										backgroundColor: "#fff",
										padding: 20,
										borderTopLeftRadius: 12,
										borderTopRightRadius: 12,
									}}
								>
									{[
										{ label: "Giá tăng dần", value: "price_asc" },
										{ label: "Giá giảm dần", value: "price_desc" },
										{ label: "Khoảng cách tăng dần", value: "distance_asc" },
										{ label: "Khoảng cách giảm dần", value: "distance_desc" },
										{ label: "Đánh giá tốt nhất", value: "rating_desc" },
									].map((opt) => (
										<TouchableOpacity
											key={opt.value}
											onPress={() => {
												setFilters({
													...filters,
													sortBy:
														filters.sortBy === opt.value ? undefined : (opt.value as any),
												});
												setShowSortModal(false);
											}}
											style={{ paddingVertical: 14 }}
										>
											<Text
												style={{
													color: filters.sortBy === opt.value ? COLORS.primary : "#111827",
													fontWeight: filters.sortBy === opt.value ? "700" : "500",
												}}
											>
												{opt.label}
											</Text>
										</TouchableOpacity>
									))}
									<TouchableOpacity
										onPress={() => setShowSortModal(false)}
										style={{ marginTop: 8, marginBottom: 18, alignItems: "center" }}
									>
										<Text style={{ color: COLORS.primary, fontWeight: "700" }}>Đóng</Text>
									</TouchableOpacity>
								</View>
							</View>
						</Modal>
					</View>
				</ScrollView>

				{/* Footer */}
				<View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
					<TouchableOpacity
						onPress={reset}
						style={{
							flex: 1,
							padding: 14,
							borderRadius: 12,
							backgroundColor: "#fff",
							alignItems: "center",
						}}
					>
						<Text style={{ color: "#111827", fontWeight: "600" }}>Đặt lại</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={apply}
						style={{
							flex: 1,
							padding: 14,
							borderRadius: 12,
							backgroundColor: COLORS.primary,
							alignItems: "center",
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "700" }}>Áp dụng</Text>
					</TouchableOpacity>
				</View>

				<MapPickerModal
					visible={showMapPicker}
					onClose={() => setShowMapPicker(false)}
					onSelect={(lat, lng, addressParts) => {
						setShowMapPicker(false);
						setFilters({
							...filters,
							lat: Number(lat),
							lng: Number(lng),
							locationLabel: addressParts?.fullAddress || addressParts?.address,
							radius: filters.radius ?? 10,
						});
					}}
					initialLat={filters.lat?.toString()}
					initialLng={filters.lng?.toString()}
				/>
			</View>
		</Modal>
	);
}
