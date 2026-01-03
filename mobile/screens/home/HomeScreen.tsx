import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { apiVehicle } from "@/services/api.vehicle";
import { COLORS } from "@/constants/colors";
import { POPULAR_CITIES } from "@/constants/city.constants";
import VehiclesList from "@/screens/vehicles/components/VehiclesList";
import UserHeaderSection from "./components/UserHeaderSection";
import VehicleSearchBar from "./components/VehicleSearchBar";
import type { Vehicle } from "@/screens/vehicles/types";

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{
    city?: string;
    district?: string;
    lat?: number;
    lng?: number;
  }>({});
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [refreshing, setRefreshing] = useState(false);

  // Fetch popular vehicles
  const { data: popularVehicles, isLoading: isLoadingPopular, refetch: refetchPopular } = useQuery({
    queryKey: ["popularVehicles"],
    queryFn: () => apiVehicle.getPopularVehicles(10),
  });

  // Fetch vehicles by city for each popular city - call hooks at top level
  const hanoiQuery = useQuery({
    queryKey: ["vehiclesByCity", POPULAR_CITIES[0].value],
    queryFn: () => apiVehicle.getVehiclesByCity(POPULAR_CITIES[0].value, 10),
  });

  const hcmQuery = useQuery({
    queryKey: ["vehiclesByCity", POPULAR_CITIES[1].value],
    queryFn: () => apiVehicle.getVehiclesByCity(POPULAR_CITIES[1].value, 10),
  });

  const danangQuery = useQuery({
    queryKey: ["vehiclesByCity", POPULAR_CITIES[2].value],
    queryFn: () => apiVehicle.getVehiclesByCity(POPULAR_CITIES[2].value, 10),
  });

  const haiphongQuery = useQuery({
    queryKey: ["vehiclesByCity", POPULAR_CITIES[3].value],
    queryFn: () => apiVehicle.getVehiclesByCity(POPULAR_CITIES[3].value, 10),
  });

  // Map queries to cities
  const cityQueries = [
    { city: POPULAR_CITIES[0].value, query: hanoiQuery },
    { city: POPULAR_CITIES[1].value, query: hcmQuery },
    { city: POPULAR_CITIES[2].value, query: danangQuery },
    { city: POPULAR_CITIES[3].value, query: haiphongQuery },
  ];

  const handleVehiclePress = (vehicle: Vehicle) => {
    router.push(`/vehicle/${vehicle.id}` as any);
  };

  const handleSearch = (filters: {
    search?: string;
    city?: string;
    district?: string;
    startDate?: Date;
    endDate?: Date;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    // Navigate to search results screen with filters as params
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.city) params.append("city", filters.city);
    if (filters.district) params.append("district", filters.district);
    if (filters.startDate)
      params.append("startDate", filters.startDate.toISOString());
    if (filters.endDate)
      params.append("endDate", filters.endDate.toISOString());
    if (filters.lat) params.append("lat", filters.lat.toString());
    if (filters.lng) params.append("lng", filters.lng.toString());
    if (filters.radius) params.append("radius", filters.radius.toString());

    router.push(`/search?${params.toString()}` as any);
  };

  const handleCityChange = (city: string) => {
    setLocation((prev) => ({ ...prev, city }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation((prev) => ({ ...prev, lat, lng }));
  };

  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Invalidate queries to bypass cache completely
      await queryClient.invalidateQueries({ queryKey: ["popularVehicles"] });
      await queryClient.invalidateQueries({ queryKey: ["vehiclesByCity"] });

      // Refetch all queries after invalidation
      await Promise.all([
        refetchPopular(),
        hanoiQuery.refetch(),
        hcmQuery.refetch(),
        danangQuery.refetch(),
        haiphongQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <View className="flex-1 bg-white">
        {/* User Header Section - Only orange part */}
        <View style={{ backgroundColor: COLORS.primary }}>
          <SafeAreaView edges={["left", "right"]}>
            <UserHeaderSection />
          </SafeAreaView>
        </View>

        {/* Content Section - White background */}
        <ScrollView
          className="flex-1 bg-white"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          // Android performance optimizations
          removeClippedSubviews={true}
          decelerationRate="fast"
          overScrollMode="never"
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Search Bar */}
          <View className="px-4 pt-4 pb-2">
            <VehicleSearchBar
              onSearch={handleSearch}
              onCityChange={handleCityChange}
              onLocationChange={handleLocationChange}
              onDateRangeChange={handleDateRangeChange}
              location={location}
              dateRange={dateRange}
            />
          </View>

          {/* Popular Vehicles Section */}
          <View className="px-4 mt-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <MaterialIcons
                  name="trending-up"
                  size={24}
                  color={COLORS.primary}
                />
                <Text className="text-xl font-bold text-gray-900 ml-2">
                  Xe phổ biến
                </Text>
              </View>
            </View>

            {isLoadingPopular ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <VehiclesList
                vehicles={popularVehicles || []}
                variant="compact"
                onVehiclePress={handleVehiclePress}
              />
            )}
          </View>

          {/* Vehicles by City Sections */}
          {cityQueries.map(({ city, query }) => {
            const { data: vehicles, isLoading } = query;
            if (isLoading || !vehicles || vehicles.length === 0) return null;

            return (
              <View key={city} className="px-4 mt-6">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="location-city"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text className="text-xl font-bold text-gray-900 ml-2">
                      Xe tại {city}
                    </Text>
                  </View>
                </View>

                <VehiclesList
                  vehicles={vehicles}
                  variant="compact"
                  onVehiclePress={handleVehiclePress}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
