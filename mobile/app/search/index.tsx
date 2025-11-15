import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SearchForm } from "@/components/search/search-form";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    location?: string;
    startDate?: string;
    endDate?: string;
  }>();

  const [page] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(params.location || "TP. Hồ Chí Minh");
  const [startDate, setStartDate] = useState(
    params.startDate ? new Date(params.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState(
    params.endDate
      ? new Date(params.endDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "vehicles-search",
      {
        page,
        location,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    ],
    queryFn: () =>
      vehiclesApi.listPublic({
        page,
        limit: 20,
        // TODO: Add cityId filter when backend supports it
      }),
    enabled: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (searchParams: {
    location: string;
    startDate: Date;
    endDate: Date;
  }) => {
    setLocation(searchParams.location);
    setStartDate(searchParams.startDate);
    setEndDate(searchParams.endDate);
  };

  // Query will automatically refetch when queryKey changes

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <MaterialIcons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              Tìm kiếm xe
            </Text>
            <View className="w-10" />
          </View>
        </View>

        {/* Vehicle List with Search Form */}
        {isLoading && !data ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-600">Đang tải kết quả...</Text>
          </View>
        ) : !data?.items || data.items.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-lg font-semibold text-gray-900">
              Không tìm thấy xe
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Không có xe nào phù hợp với tiêu chí tìm kiếm của bạn
            </Text>
          </View>
        ) : (
          <FlatList
            data={data.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <>
                <View className="pt-4">
                  <SearchForm
                    initialLocation={location}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                    onSearch={handleSearch}
                  />
                </View>
                {/* Results Header */}
                <View className="px-6 py-3 bg-white border-b border-gray-200">
                  <Text className="text-base font-semibold text-gray-900">
                    {data?.total
                      ? `${data.total} xe được tìm thấy`
                      : "Đang tìm kiếm..."}
                  </Text>
                </View>
              </>
            }
            renderItem={({ item }) => (
              <View className="px-6">
                <VehicleCard vehicle={item} />
              </View>
            )}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

