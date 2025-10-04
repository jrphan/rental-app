import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useLogout, useCurrentUser } from "../../queries/auth";
import { useRouter } from "expo-router";
import DesignSystemDemo from "../../components/DesignSystemDemo";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  // Use React Query hooks
  const logoutMutation = useLogout();
  const currentUser = useCurrentUser();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if logout API fails
      router.replace("/(auth)/login");
    }
  };

  return (
    <View style={styles.container}>
      <DesignSystemDemo />
      <Text style={styles.welcome}>
        Chào mừng, {user ? `${user.firstName} ${user.lastName}` : "User"}!
      </Text>
      <Text style={styles.subtitle}>Ứng dụng cho thuê xe</Text>

      <View style={styles.userInfo}>
        <Text style={styles.infoText}>Email: {user?.email}</Text>
        <Text style={styles.infoText}>Điện thoại: {user?.phone}</Text>
        <Text style={styles.infoText}>Vai trò: {user?.role}</Text>
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
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 30,
  },
  userInfo: {
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
  infoText: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 8,
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
