import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import HeaderBase from "@/components/header/HeaderBase";
import { apiUser } from "@/services/api.user";
import { COLORS } from "@/constants/colors";
import VehicleCard from "@/screens/vehicles/components/VehicleCard";
import type { Vehicle } from "@/screens/vehicles/types";

export default function FavoritesScreen() {
  const {
    data: favoritesData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiUser.getFavorites(),
  });

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Xe yêu thích" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">
            Đang tải danh sách yêu thích...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Xe yêu thích" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-600 text-center">
            Không thể tải danh sách yêu thích. Vui lòng thử lại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorites = favoritesData?.items || [];
  const total = favoritesData?.total || 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Xe yêu thích" showBackButton />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[COLORS.primary]}
          />
        }
      >
        {total === 0 ? (
          <View className="flex-1 items-center justify-center px-4 py-20">
            <Text className="text-lg font-medium text-gray-900 mb-2">
              Chưa có xe yêu thích
            </Text>
            <Text className="text-sm text-gray-600 text-center">
              Bạn chưa thêm xe nào vào danh sách yêu thích. Hãy khám phá và thêm
              những chiếc xe bạn quan tâm nhé!
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-4">
            <Text className="text-sm text-gray-600 mb-4">
              Bạn có {total} xe trong danh sách yêu thích
            </Text>
            {favorites.map((vehicle: Vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} variant="full" />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
