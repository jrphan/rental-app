import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, RefreshControl, StatusBar } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api.vehicles";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { useState } from "react";
import { useRequirePhoneVerification } from "@/lib/auth";

export default function VehiclesScreen() {
  const { requirePhoneVerification } = useRequirePhoneVerification({
    message: "Vui lòng xác minh số điện thoại để đặt xe",
  });

  const [page] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicles-public", { page }],
    queryFn: () => vehiclesApi.listPublic({ page, limit: 20 }),
  });

  // Check phone verification - MUST be after all hooks
  if (!requirePhoneVerification()) {
    return null; // Đã redirect
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Danh sách xe cho thuê
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Tìm xe máy phù hợp với nhu cầu của bạn
          </Text>
        </View>

        {/* Vehicle List */}
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
    </>
  );
}

