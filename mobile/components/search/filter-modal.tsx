import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type FilterShape = {
	sort?: "price_asc" | "price_desc" | "distance" | "rating";
	vehicleTypeIds?: string[];
	minPrice?: number;
	maxPrice?: number;
};

export function FilterModal({
	visible,
	onClose,
	vehicleTypes = [],
	modalFilter,
	setModalFilter,
	onApply,
	onReset,
}: {
	visible: boolean;
	onClose: () => void;
	vehicleTypes?: any[];
	modalFilter: FilterShape;
	setModalFilter: (updater: FilterShape | ((c: FilterShape) => FilterShape)) => void;
	onApply: (f: FilterShape) => void;
	onReset: () => void;
}) {
	const [sortModalVisible, setSortModalVisible] = useState(false);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<TouchableOpacity
				activeOpacity={1}
				onPress={onClose}
				style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
			>
				<TouchableOpacity
					activeOpacity={1}
					onPress={(e) => e.stopPropagation()}
					style={{
						backgroundColor: "#fff",
						padding: 20,
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						minHeight: "92%",
						position: "relative",
					}}
				>
					{/* Header */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: 10,
						}}
					>
						<Text style={{ fontSize: 20, fontWeight: "700" }}>Bộ lọc</Text>
						<TouchableOpacity
							onPress={onClose}
							style={{
								width: 36,
								height: 36,
								borderRadius: 18,
								backgroundColor: "#F3F4F6",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<MaterialIcons name="close" size={20} color="#6B7280" />
						</TouchableOpacity>
					</View>

					<ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
						<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
							Loại xe
						</Text>
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
							{vehicleTypes?.map((t: any) => {
								const selected = (modalFilter.vehicleTypeIds || []).includes(t.id);
								return (
									<TouchableOpacity
										key={t.id}
										onPress={() => {
											setModalFilter((cur: any) => {
												const ids = cur.vehicleTypeIds || [];
												return {
													...cur,
													vehicleTypeIds: ids.includes(t.id)
														? ids.filter((x) => x !== t.id)
														: [...ids, t.id],
												};
											});
										}}
										style={{
											paddingVertical: 8,
											paddingHorizontal: 12,
											borderRadius: 20,
											borderWidth: 1,
											borderColor: selected ? "#EA580C" : "#DDD",
											margin: 4,
										}}
									>
										<Text style={{ color: selected ? "#EA580C" : "#000" }}>
											{t.description || t.name}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>

						<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
							Khoảng giá (VND) mỗi ngày
						</Text>
						<View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 6 }}>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Min (₫)</Text>
								<TextInput
									placeholder="0"
									placeholderTextColor="#9CA3AF"
									keyboardType="numeric"
									value={modalFilter.minPrice ? String(modalFilter.minPrice) : ""}
									onChangeText={(t) =>
										setModalFilter((m: any) => ({
											...m,
											minPrice: t ? Number(t.replace(/[^0-9]/g, "")) : undefined,
										}))
									}
									style={{
										borderWidth: 1,
										borderColor: "#E5E7EB",
										padding: 10,
										borderRadius: 8,
										backgroundColor: "#fff",
										color: "#111827",
									}}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>Max (₫)</Text>
								<TextInput
									placeholder="2000000"
									placeholderTextColor="#9CA3AF"
									keyboardType="numeric"
									value={modalFilter.maxPrice ? String(modalFilter.maxPrice) : ""}
									onChangeText={(t) =>
										setModalFilter((m: any) => ({
											...m,
											maxPrice: t ? Number(t.replace(/[^0-9]/g, "")) : undefined,
										}))
									}
									style={{
										borderWidth: 1,
										borderColor: "#E5E7EB",
										padding: 10,
										borderRadius: 8,
										backgroundColor: "#fff",
										color: "#111827",
									}}
								/>
							</View>
						</View>

						<Text style={{ marginTop: 30, marginBottom: 10, fontWeight: "600", fontSize: 16 }}>
							Sắp xếp
						</Text>
						<View>
							<TouchableOpacity
								onPress={() => setSortModalVisible(true)}
								style={{
									borderWidth: 1,
									borderColor: "#E5E7EB",
									padding: 12,
									borderRadius: 8,
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									backgroundColor: "#fff",
								}}
							>
								<Text style={{ color: modalFilter.sort ? "#111" : "#9CA3AF" }}>
									{modalFilter.sort === "price_asc"
										? "Giá tăng dần"
										: modalFilter.sort === "price_desc"
										? "Giá giảm dần"
										: modalFilter.sort === "distance"
										? "Khoảng cách gần nhất"
										: modalFilter.sort === "rating"
										? "Đánh giá"
										: "Chọn cách sắp xếp"}
								</Text>
								<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
									{modalFilter.sort ? (
										<TouchableOpacity
											onPress={() => setModalFilter((m: any) => ({ ...m, sort: undefined }))}
											style={{ padding: 6 }}
										>
											<MaterialIcons name="close" size={18} color="#6B7280" />
										</TouchableOpacity>
									) : null}
									<MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
								</View>
							</TouchableOpacity>
						</View>
					</ScrollView>

					{/* Action bar */}
					<View
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							bottom: 50,
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							borderTopWidth: 1,
							borderTopColor: "#ccccccff",
							padding: 25,
						}}
					>
						<TouchableOpacity
							onPress={() => {
								setModalFilter({});
								onReset();
							}}
							style={{ padding: 12 }}
						>
							<Text style={{ fontSize: 16, textDecorationLine: "underline" }}>Đặt lại</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={() => onApply(modalFilter)}
							style={{
								backgroundColor: "#EA580C",
								paddingVertical: 12,
								paddingHorizontal: 32,
								borderRadius: 8,
							}}
						>
							<Text style={{ color: "#fff", fontSize: 16 }}>Áp dụng</Text>
						</TouchableOpacity>
					</View>

					{/* Sort options modal */}
					<Modal
						visible={sortModalVisible}
						transparent
						animationType="slide"
						onRequestClose={() => setSortModalVisible(false)}
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={() => setSortModalVisible(false)}
							style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}
						>
							<TouchableOpacity
								activeOpacity={1}
								onPress={(e) => e.stopPropagation()}
								style={{
									backgroundColor: "#fff",
									borderTopLeftRadius: 12,
									borderTopRightRadius: 12,
									padding: 20,
									minHeight: "33%",
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
									<Text style={{ fontSize: 18, fontWeight: "700" }}>Sắp xếp theo</Text>
									<TouchableOpacity onPress={() => setSortModalVisible(false)} style={{ padding: 6 }}>
										<MaterialIcons name="close" size={20} color="#6B7280" />
									</TouchableOpacity>
								</View>
								{[
									{ key: "price_asc", label: "Giá tăng dần" },
									{ key: "price_desc", label: "Giá giảm dần" },
									{ key: "distance", label: "Khoảng cách gần nhất" },
									{ key: "rating", label: "Đánh giá" },
								].map((s) => {
									const selected = modalFilter.sort === s.key;
									return (
										<TouchableOpacity
											key={s.key}
											onPress={() => {
												setModalFilter((m: any) => ({ ...m, sort: s.key as any }));
												setSortModalVisible(false);
											}}
											style={{
												paddingVertical: 12,
												paddingHorizontal: 6,
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "space-between",
											}}
										>
											<Text style={{ color: selected ? "#EA580C" : "#111", fontSize: 16 }}>
												{s.label}
											</Text>
											{selected ? <MaterialIcons name="check" size={20} color="#EA580C" /> : null}
										</TouchableOpacity>
									);
								})}
							</TouchableOpacity>
						</TouchableOpacity>
					</Modal>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
}
