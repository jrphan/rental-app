import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/queries";
import { log } from "console";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
	icon: IoniconName;
	label: string;
	screen?: string; // màn hình sẽ chuyển tới (nếu có)
}

export default function ProfileScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const logoutMutation = useLogout();
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
	// Các mục trong menu
	const menuItems: MenuItem[] = [
		{ icon: "car-outline", label: "Đăng ký cho thuê xe" },
		{ icon: "heart-outline", label: "Xe yêu thích" },
		{ icon: "document-text-outline", label: "Địa chỉ của tôi" },
		{ icon: "document-text-outline", label: "Giấy phép lái xe" },
		{ icon: "card-outline", label: "Thẻ thanh toán" },
		{ icon: "star-outline", label: "Đánh giá từ chủ xe" },
	];

	const otherItems: MenuItem[] = [
		{ icon: "gift-outline", label: "Quà tặng" },
		{ icon: "share-social-outline", label: "Giới thiệu bạn mới" },
		{ icon: "lock-closed-outline", label: "Đổi mật khẩu" },
		{ icon: "trash-outline", label: "Yêu cầu xóa tài khoản" },
	];

	return (
		<ScrollView style={styles.container}>
			{/* Header người dùng */}
			<TouchableOpacity
				style={styles.profileHeader}
				onPress={() => router.push("/(subtabs)/profile_detail")} // chuyển sang trang EditProfile
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

			{/* Menu chính */}
			<View style={styles.menu}>
				{menuItems.map((item, idx) => (
					<TouchableOpacity key={idx} style={styles.menuItem}>
						<Ionicons name={item.icon} size={22} color="#333" />
						<Text style={styles.menuLabel}>{item.label}</Text>
						<Ionicons name="chevron-forward-outline" size={18} color="#999" />
					</TouchableOpacity>
				))}
			</View>

			{/* Mục khác */}
			<View style={styles.menu}>
				{otherItems.map((item, idx) => (
					<TouchableOpacity key={idx} style={styles.menuItem}>
						<Ionicons name={item.icon} size={22} color="#333" />
						<Text style={styles.menuLabel}>{item.label}</Text>
						<Ionicons name="chevron-forward-outline" size={18} color="#999" />
					</TouchableOpacity>
				))}
			</View>

			{/* Đăng xuất */}
			<TouchableOpacity style={styles.logoutBtn}
				onPress={handleLogout}
				disabled={logoutMutation.isPending}
			>
				<Text style={styles.logoutText}>
					{logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
				</Text>
				<Ionicons name="log-out-outline" size={20} color="red" />
			</TouchableOpacity>
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
});
