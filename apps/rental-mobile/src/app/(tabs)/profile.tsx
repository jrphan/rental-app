import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout, useDeleteAccount } from "@/queries";
import { log } from "console";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
	icon: IoniconName;
	label: string;
	screen?: string;
	action?: string;
}

export default function ProfileScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const logoutMutation = useLogout();
	const deleteAccountMutation = useDeleteAccount();
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const handleLogout = () => {
		Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
			{ text: "Hủy", style: "cancel" },
			{
				text: "Đăng xuất",
				style: "destructive",
				onPress: async () => {
					try {
						await logoutMutation.mutateAsync();
					} catch (error) {
						console.error("Logout error:", error);
					}
				},
			},
		]);
	};

	const handleDeleteAccount = () => {
		setShowDeleteModal(true);
	};

	const confirmDeleteAccount = async () => {
		try {
			await deleteAccountMutation.mutateAsync();
		} catch (error) {
			console.error("Delete account error:", error);
		}
	};

	const menuItems: MenuItem[] = [
		{ icon: "car-outline", label: "Đăng ký cho thuê xe" },
		{ icon: "heart-outline", label: "Xe yêu thích" },
		{ icon: "location-outline", label: "Địa chỉ của tôi" },
		{ icon: "document-text-outline", label: "Giấy phép lái xe" },
		// { icon: "card-outline", label: "Thẻ thanh toán" },
		// { icon: "star-outline", label: "Đánh giá từ chủ xe" },
	];

	const otherItems: MenuItem[] = [
		// { icon: "gift-outline", label: "Quà tặng" },
		// { icon: "share-social-outline", label: "Giới thiệu bạn mới" },
		{ icon: "lock-closed-outline", label: "Đổi mật khẩu", screen: "/(subtabs)/change_password" },
		{ icon: "trash-outline", label: "Yêu cầu xóa tài khoản", action: "delete" },
	];

	return (
		<ScrollView style={styles.container}>

			<TouchableOpacity
				style={styles.profileHeader}
				onPress={() => router.push("/(subtabs)/profile_detail")}
			>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>T</Text>
				</View>
				<View style={{ flex: 1 }}>
					<Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : "User"}</Text>
					<Text style={styles.email}>{user?.email}</Text>
				</View>
				<Ionicons name="chevron-forward-outline" size={20} color="#999" />
			</TouchableOpacity>

			<View style={styles.menu}>
				{menuItems.map((item, idx) => (
					<TouchableOpacity key={idx} style={styles.menuItem}>
						<Ionicons name={item.icon} size={22} color="#333" />
						<Text style={styles.menuLabel}>{item.label}</Text>
						<Ionicons name="chevron-forward-outline" size={18} color="#999" />
					</TouchableOpacity>
				))}
			</View>

			<View style={styles.menu}>
				{otherItems.map((item, idx) => (
					<TouchableOpacity
						key={idx}
						style={styles.menuItem}
						onPress={() => {
							if (item.screen) {
								router.push(item.screen);
							} else if (item.action === "delete") {
								handleDeleteAccount();
							}
						}}
					>
						<Ionicons name={item.icon} size={22} color="#333" />
						<Text style={styles.menuLabel}>{item.label}</Text>
						<Ionicons name="chevron-forward-outline" size={18} color="#999" />
					</TouchableOpacity>
				))}
			</View>

			<TouchableOpacity style={styles.logoutBtn}
				onPress={handleLogout}
				disabled={logoutMutation.isPending}
			>
				<Text style={styles.logoutText}>
					{logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
				</Text>
				<Ionicons name="log-out-outline" size={20} color="red" />
			</TouchableOpacity>

			{/* Delete Account Confirmation Modal */}
			<Modal
				visible={showDeleteModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowDeleteModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Ionicons name="warning" size={24} color="#ff4444" />
							<Text style={styles.modalTitle}>Yêu cầu xoá tài khoản?</Text>
						</View>

						<Text style={styles.modalMessage}>
							Hành động xoá tài khoản sẽ xoá toàn bộ dữ liệu liên quan đến tài khoản này trên hệ thống lưu trữ thông tin của ứng dụng MoRent. Chỉ xoá một lần và không thể phục hồi lại như cũ.
						</Text>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={styles.cancelButton}
								onPress={() => setShowDeleteModal(false)}
								disabled={deleteAccountMutation.isPending}
							>
								<Text style={styles.cancelButtonText}>Hủy</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.deleteButton}
								onPress={confirmDeleteAccount}
								disabled={deleteAccountMutation.isPending}
							>
								{deleteAccountMutation.isPending ? (
									<ActivityIndicator size="small" color="#fff" />
								) : (
									<Text style={styles.deleteButtonText}>Xoá tài khoản</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#f9f9f9" },
	profileHeader: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		paddingVertical: 20,
		paddingHorizontal: 15,
		marginBottom: 10,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#6c63ff",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
	name: { fontWeight: "600", fontSize: 16 },
	email: { color: "#777" },
	menu: { backgroundColor: "#fff", marginTop: 10 },
	menuItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderBottomColor: "#eee",
		borderBottomWidth: 1,
	},
	menuLabel: { flex: 1, marginLeft: 10, fontSize: 15 },
	logoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fff",
		padding: 15,
		marginTop: 20,
		gap: 5,
	},
	logoutText: { color: "red", fontWeight: "bold" },

	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	modalContent: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 20,
		width: "100%",
		maxWidth: 400,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginLeft: 8,
		color: "#333",
	},
	modalMessage: {
		fontSize: 14,
		lineHeight: 20,
		color: "#666",
		marginBottom: 24,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: 12,
	},
	cancelButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	cancelButtonText: {
		color: "#666",
		fontSize: 16,
		fontWeight: "500",
	},
	deleteButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		backgroundColor: "#ff4444",
		minWidth: 120,
		alignItems: "center",
	},
	deleteButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
