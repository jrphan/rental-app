import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, TextInput } from "react-native";
import { PROMOS, type Promo } from "@/constants/promos";
import { COLORS } from "@/constants/colors";

type Props = {
	visible: boolean;
	onClose: () => void;
	onApply: (promo?: Promo, inputCode?: string) => void;
	selected?: Promo | null;
};

export default function PromoModal({ visible, onClose, onApply, selected }: Props) {
	const [input, setInput] = useState("");
	const [chosen, setChosen] = useState<Promo | null>(selected || null);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
				<View
					style={{
						backgroundColor: "#fff",
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						padding: 18,
						minHeight: "70%",
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
						<Text style={{ fontSize: 16, fontWeight: "600" }}>Mã khuyến mãi</Text>
						<TouchableOpacity onPress={onClose}>
							<Text style={{ color: COLORS.primary, fontWeight: "600" }}>Đóng</Text>
						</TouchableOpacity>
					</View>

					<TextInput
						placeholder="Nhập mã giảm giá"
						placeholderTextColor="#9CA3AF"
						value={input}
						onChangeText={setInput}
						style={{
							borderWidth: 1,
							borderColor: "#E5E7EB",
							borderRadius: 8,
							padding: 10,
							marginBottom: 12,
						}}
					/>

					<FlatList
						data={PROMOS}
						keyExtractor={(i) => i.id}
						renderItem={({ item }) => (
							<TouchableOpacity
								onPress={() => setChosen(item)}
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									alignItems: "center",
									paddingVertical: 10,
									borderBottomWidth: 1,
									borderColor: "#F3F4F6",
								}}
							>
								<View style={{ flex: 1 }}>
									<Text style={{ fontWeight: "700" }}>
										{item.title} · {item.code}
									</Text>
									<Text style={{ color: "#6B7280", marginTop: 4 }}>{item.description}</Text>
								</View>
								<View>
									<Text
										style={{
											color: chosen?.id === item.id ? COLORS.primary : "#9CA3AF",
											fontWeight: "700",
										}}
									>
										{chosen?.id === item.id ? "Đã chọn" : "Chọn"}
									</Text>
								</View>
							</TouchableOpacity>
						)}
						style={{ marginBottom: 12 }}
					/>

					<View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
						<TouchableOpacity
							onPress={() => {
								onApply(chosen ? chosen : undefined, input || undefined);
								onClose();
							}}
							style={{
								flex: 1,
								backgroundColor: COLORS.primary,
								padding: 12,
								borderRadius: 8,
								alignItems: "center",
							}}
						>
							<Text style={{ color: "#fff", fontWeight: "700" }}>Xác nhận</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								setInput("");
								setChosen(null);
							}}
							style={{
								padding: 12,
								borderRadius: 8,
								borderWidth: 1,
								borderColor: "#E5E7EB",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Text>Xóa</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}
