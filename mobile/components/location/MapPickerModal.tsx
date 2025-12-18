import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import * as Location from "expo-location";

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: string, lng: string) => void;
  initialLat?: string;
  initialLng?: string;
}

export default function MapPickerModal({
  visible,
  onClose,
  onSelect,
  initialLat,
  initialLng,
}: MapPickerModalProps) {
  const [region, setRegion] = useState<Region>({
    latitude: initialLat ? parseFloat(initialLat) : 10.762622, // Default to HCM
    longitude: initialLng ? parseFloat(initialLng) : 106.660172,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat && initialLng
      ? {
          lat: parseFloat(initialLat),
          lng: parseFloat(initialLng),
        }
      : null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Try to get current location when modal opens
  useEffect(() => {
    if (visible && !initialLat && !initialLng) {
      getCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setSelectedLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ lat: latitude, lng: longitude });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(
        selectedLocation.lat.toString(),
        selectedLocation.lng.toString()
      );
      onClose();
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Use geocoding to search for addresses
      const results = await Location.geocodeAsync(query);

      if (results.length > 0) {
        setSearchResults(results.slice(0, 5)); // Limit to 5 results
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (
    result: Location.LocationGeocodedLocation
  ) => {
    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    setSelectedLocation({
      lat: result.latitude,
      lng: result.longitude,
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn vị trí trên bản đồ</Text>
          <TouchableOpacity
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
            style={styles.locationButton}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MaterialIcons
                name="my-location"
                size={24}
                color={COLORS.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa chỉ (ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM)"
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
            {isSearching && (
              <ActivityIndicator size="small" color={COLORS.primary} />
            )}
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <MaterialIcons
                      name="place"
                      size={20}
                      color={COLORS.primary}
                    />
                    <View style={styles.searchResultTextContainer}>
                      <Text style={styles.searchResultText} numberOfLines={2}>
                        {item.name || item.street || "Địa chỉ"}
                      </Text>
                      {(item.street || item.city) && (
                        <Text
                          style={styles.searchResultSubtext}
                          numberOfLines={1}
                        >
                          {[item.street, item.city, item.region, item.country]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
              />
            </View>
          )}
        </View>

        {/* Map */}
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
              }}
              pinColor={COLORS.primary}
            />
          )}
        </MapView>

        {/* Info and Confirm Button */}
        <View style={styles.footer}>
          {selectedLocation ? (
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>Vị trí đã chọn:</Text>
              <Text style={styles.coordinateText}>
                {selectedLocation.lat.toFixed(6)},{" "}
                {selectedLocation.lng.toFixed(6)}
              </Text>
            </View>
          ) : (
            <Text style={styles.hintText}>
              👆 Chạm vào bản đồ để chọn vị trí
            </Text>
          )}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedLocation}
            style={[
              styles.confirmButton,
              !selectedLocation && styles.confirmButtonDisabled,
            ]}
          >
            <Text style={styles.confirmButtonText}>Xác nhận vị trí</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  locationButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 4,
  },
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  searchResultTextContainer: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  searchResultSubtext: {
    fontSize: 12,
    color: "#6B7280",
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  coordinateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "monospace",
  },
  hintText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
