import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { apiVehicle } from "@/services/api.vehicle";
import { COLORS } from "@/constants/colors";
import VehicleCard from "@/screens/vehicles/components/VehicleCard";
import HeaderBase from "@/components/header/HeaderBase";
import VehicleSearchBar from "../home/components/VehicleSearchBar";
import type { Vehicle } from "@/screens/vehicles/types";

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    search?: string;
    city?: string;
    district?: string;
    startDate?: string;
    endDate?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  }>();

  const [location, setLocation] = useState<{
    city?: string;
    district?: string;
    lat?: number;
    lng?: number;
  }>({
    city: params.city,
    district: params.district,
    lat: params.lat ? Number(params.lat) : undefined,
    lng: params.lng ? Number(params.lng) : undefined,
  });

  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
  });

  // Parse search filters from params
  const searchFilters = {
    search: params.search,
    city: location.city,
    district: location.district,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    lat: location.lat,
    lng: location.lng,
    radius: params.radius ? Number(params.radius) : undefined,
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
    const newParams = new URLSearchParams();
    if (filters.search) newParams.append("search", filters.search);
    if (filters.city) newParams.append("city", filters.city);
    if (filters.district) newParams.append("district", filters.district);
    if (filters.startDate)
      newParams.append("startDate", filters.startDate.toISOString());
    if (filters.endDate)
      newParams.append("endDate", filters.endDate.toISOString());
    if (filters.lat) newParams.append("lat", filters.lat.toString());
    if (filters.lng) newParams.append("lng", filters.lng.toString());
    if (filters.radius) newParams.append("radius", filters.radius.toString());

    router.replace(`/search?${newParams.toString()}` as any);
  };

  const handleCityChange = (city: string) => {
    setLocation((prev) => ({ ...prev, city }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation((prev) => ({ ...prev, lat, lng }));
  };

  const handleDateRangeChange = (startDate?: Date, endDate?: Date) => {
    // Validation: endDate phải >= startDate
    if (startDate && endDate && endDate < startDate) {
      // Nếu endDate < startDate, chỉ cập nhật startDate và xóa endDate
      setDateRange({ startDate, endDate: undefined });
      return;
    }
    setDateRange({ startDate, endDate });
  };

  // Fetch search results
  const {
    data: searchResults,
    isLoading: isLoadingSearch,
    isError: isErrorSearch,
  } = useQuery({
    queryKey: ["searchVehicles", searchFilters],
    queryFn: () => {
      return apiVehicle.searchVehicles({
        ...searchFilters,
        startDate: searchFilters.startDate?.toISOString(),
        endDate: searchFilters.endDate?.toISOString(),
      });
    },
  });

  const renderVehicleList = (vehicles: Vehicle[] | undefined) => {
    if (!vehicles || vehicles.length === 0) {
      return (
        <View className="py-8 items-center">
          <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-gray-500 text-center">
            Không tìm thấy xe nào phù hợp
          </Text>
          <Text className="mt-2 text-sm text-gray-400 text-center px-4">
            Hãy thử thay đổi bộ lọc tìm kiếm của bạn
          </Text>
        </View>
      );
    }

    return (
      <View>
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} variant="full" />
        ))}
      </View>
    );
  };

  const getSearchSummary = () => {
    const parts: string[] = [];
    if (searchFilters.search) parts.push(`"${searchFilters.search}"`);
    if (searchFilters.city) parts.push(`tại ${searchFilters.city}`);
    if (searchFilters.district) parts.push(`quận ${searchFilters.district}`);
    if (searchFilters.startDate && searchFilters.endDate) {
      const start = searchFilters.startDate.toLocaleDateString("vi-VN");
      const end = searchFilters.endDate.toLocaleDateString("vi-VN");
      parts.push(`từ ${start} đến ${end}`);
    }
    return parts.length > 0 ? parts.join(" • ") : "Tất cả xe";
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Tìm kiếm xe" showBackButton />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-2 mb-4">
          <VehicleSearchBar
            onSearch={handleSearch}
            onCityChange={handleCityChange}
            onLocationChange={handleLocationChange}
            onDateRangeChange={handleDateRangeChange}
            location={location}
            dateRange={dateRange}
          />
        </View>

        <View className="px-4 pt-2">
          {/* Search Summary */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">
              Đang tìm kiếm: {getSearchSummary()}
            </Text>
            {searchResults && searchResults.total > 0 && (
              <Text className="text-base font-semibold text-gray-900">
                Tìm thấy {searchResults.total} xe
              </Text>
            )}
          </View>

          {/* Results */}
          {isLoadingSearch ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="mt-4 text-gray-600">Đang tìm kiếm...</Text>
            </View>
          ) : isErrorSearch ? (
            <View className="py-12 items-center">
              <MaterialIcons name="error-outline" size={64} color="#EF4444" />
              <Text className="mt-4 text-red-600 text-center">
                Không thể tìm kiếm. Vui lòng thử lại.
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-4 px-6 py-2 bg-primary rounded-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                <Text className="text-white font-semibold">Quay lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderVehicleList(searchResults?.items)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
