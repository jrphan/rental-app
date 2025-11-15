import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, RefreshControl, StatusBar } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { SearchForm } from "@/components/search/search-form";
import { useState } from "react";

export default function HomeScreen() {
  const [page] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicles-public", { page }],
    queryFn: () => vehiclesApi.listPublic({ page, limit: 20 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#EA580C"
        translucent={false}
      />
      <SafeAreaView className="flex-1 bg-primary-500" edges={["left", "right"]}>
        <View className="flex-1 bg-gray-50">
          {/* Vehicle List with Header and Search Form */}
          {isLoading && !data ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-600">Đang tải danh sách xe...</Text>
            </View>
          ) : !data?.items || data.items.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-gray-600 text-center">
                Hiện chưa có xe nào được đăng cho thuê
              </Text>
            </View>
          ) : (
            <FlatList
              data={data.items}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <>
                  {/* Header with primary color background */}
                  <View className="bg-primary-500 px-6 pt-20 pb-8">
                    <Text className="text-3xl font-bold text-white">
                      Xe máy cho thuê
                    </Text>
                    <Text className="text-base text-white/90 mt-2">
                      Tìm xe máy phù hợp với nhu cầu của bạn
                    </Text>
                  </View>
                  {/* Search Form - Elevated above header */}
                  <View className="-mt-6 pb-4">
                    <SearchForm />
                  </View>
                </>
              }
              renderItem={({ item }) => (
                <View className="px-6">
                  <VehicleCard vehicle={item} />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
