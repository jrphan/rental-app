import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock data for favorite vehicles
const mockFavoriteVehicles = [
  {
    id: "1",
    name: "Honda Wave RSX 110",
    brand: "Honda",
    year: 2023,
    price: 150000,
    image: "https://via.placeholder.com/300x200",
    location: "Quận 1, TP.HCM",
    rating: 4.8,
    reviews: 24,
    isAvailable: true,
  },
  {
    id: "2",
    name: "Yamaha Exciter 155",
    brand: "Yamaha",
    year: 2023,
    price: 200000,
    image: "https://via.placeholder.com/300x200",
    location: "Quận 3, TP.HCM",
    rating: 4.9,
    reviews: 18,
    isAvailable: true,
  },
  {
    id: "3",
    name: "Suzuki Raider R150",
    brand: "Suzuki",
    year: 2022,
    price: 180000,
    image: "https://via.placeholder.com/300x200",
    location: "Quận 7, TP.HCM",
    rating: 4.7,
    reviews: 31,
    isAvailable: false,
  },
];

export default function FavoriteVehiclesScreen() {
  const router = useRouter();
  const [favoriteVehicles, setFavoriteVehicles] =
    useState(mockFavoriteVehicles);

  const handleBack = () => router.back();

  const handleRemoveFavorite = (vehicleId: string) => {
    Alert.alert("Bỏ yêu thích", "Bạn có chắc chắn muốn bỏ yêu thích xe này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Bỏ yêu thích",
        style: "destructive",
        onPress: () => {
          setFavoriteVehicles((prev) =>
            prev.filter((vehicle) => vehicle.id !== vehicleId)
          );
        },
      },
    ]);
  };

  const handleViewVehicle = (vehicleId: string) => {
    // Navigate to vehicle detail screen
    router.push(`/(tabs)/vehicles/${vehicleId}`);
  };

  const handleBookVehicle = (vehicleId: string) => {
    // Navigate to booking screen
    router.push(`/(tabs)/bookings/new?vehicleId=${vehicleId}`);
  };

  const renderVehicleItem = ({
    item,
  }: {
    item: (typeof mockFavoriteVehicles)[0];
  }) => (
    <View style={styles.vehicleCard}>
      <TouchableOpacity
        style={styles.vehicleImageContainer}
        onPress={() => handleViewVehicle(item.id)}
      >
        <Image source={{ uri: item.image }} style={styles.vehicleImage} />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="heart" size={20} color="#FF3B30" />
        </TouchableOpacity>
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Không khả dụng</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleName}>{item.name}</Text>
          <Text style={styles.vehiclePrice}>
            {item.price.toLocaleString()}đ/ngày
          </Text>
        </View>

        <View style={styles.vehicleDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.brand} • {item.year}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.detailText}>
              {item.rating} ({item.reviews} đánh giá)
            </Text>
          </View>
        </View>

        <View style={styles.vehicleActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewVehicle(item.id)}
          >
            <Text style={styles.viewButtonText}>Xem chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bookButton,
              !item.isAvailable && styles.bookButtonDisabled,
            ]}
            onPress={() => handleBookVehicle(item.id)}
            disabled={!item.isAvailable}
          >
            <Text
              style={[
                styles.bookButtonText,
                !item.isAvailable && styles.bookButtonTextDisabled,
              ]}
            >
              {item.isAvailable ? "Đặt xe" : "Không khả dụng"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xe yêu thích</Text>
        <View style={{ width: 24 }} />
      </View>

      {favoriteVehicles.length > 0 ? (
        <FlatList
          data={favoriteVehicles}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicleItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có xe yêu thích nào</Text>
          <Text style={styles.emptySubtitle}>
            Thêm xe vào danh sách yêu thích để dễ dàng tìm kiếm và đặt xe
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/(tabs)/vehicles")}
          >
            <Text style={styles.browseButtonText}>Duyệt xe</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  listContainer: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  vehicleImageContainer: {
    position: "relative",
    height: 200,
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  vehicleInfo: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  vehicleActions: {
    flexDirection: "row",
    gap: 12,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  viewButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  bookButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  bookButtonDisabled: {
    backgroundColor: "#ccc",
  },
  bookButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  bookButtonTextDisabled: {
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
