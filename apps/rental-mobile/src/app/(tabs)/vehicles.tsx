import { View, Text, StyleSheet } from "react-native";

export default function VehiclesScreen() {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Danh sách xe</Text>
      <Text style={styles.subtitle}>Tính năng đang phát triển...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
});
