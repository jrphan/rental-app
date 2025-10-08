import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useLogout } from "../../queries/auth";

export default function ProfileScreen() {
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

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user
              ? `${user.firstName} ${user.lastName}`.charAt(0).toUpperCase()
              : "U"}
          </Text>
        </View>

        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : "User"}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user?.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vai trò:</Text>
          <Text style={styles.infoValue}>
            {user?.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày tạo:</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN")
              : "N/A"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          logoutMutation.isPending && styles.disabledButton,
        ]}
        onPress={handleLogout}
        disabled={logoutMutation.isPending}
      >
        <Text style={styles.logoutButtonText}>
          {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  infoValue: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  logoutButton: {
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#bdc3c7",
  },
});
