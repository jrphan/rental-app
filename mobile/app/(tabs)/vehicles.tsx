import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, FlatList, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vehiclesApi, rentalsApi, VehicleItem } from "@/lib/api.vehicles";
import { useToast } from "@/lib/toast";
import { useState } from "react";

export default function VehiclesScreen() {
  const toast = useToast();
  const [page] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["vehicles-public", { page }],
    queryFn: () => vehiclesApi.listPublic({ page, limit: 20 }),
  });

  const createRentalMutation = useMutation({
    mutationFn: (vehicleId: string) =>
      rentalsApi.create({
        vehicleId,
        // Demo: đặt 1 ngày từ hôm nay
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    onSuccess: () => {
      toast.showSuccess("Đã gửi yêu cầu đặt xe", { title: "Thành công" });
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Đặt xe thất bại", { title: "Lỗi" });
    },
  });

  const renderItem = ({ item }: { item: VehicleItem }) => (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-gray-900">
          {item.brand} {item.model} ({item.year})
        </Text>
        <View className="flex-row items-center">
          <MaterialIcons name="verified" size={18} color="#22c55e" />
          <Text className="ml-1 text-xs text-gray-600">Đã kiểm duyệt</Text>
        </View>
      </View>
      <Text className="text-sm text-gray-700">
        Biển số: {item.licensePlate}
      </Text>
      <Text className="text-sm text-gray-700 mt-1">
        Giá ngày: {item.dailyRate} đ
      </Text>
      <TouchableOpacity
        className="mt-3 bg-orange-600 rounded-lg px-4 py-3 items-center"
        onPress={() => createRentalMutation.mutate(item.id)}
        disabled={createRentalMutation.isPending}
      >
        <Text className="text-white font-semibold">Đặt xe</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-white px-6"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1">
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-2xl font-bold text-gray-900">Danh sách xe</Text>
        </View>
        {isLoading ? (
          <Text className="text-gray-600">Đang tải...</Text>
        ) : (
          <FlatList
            data={data?.items || []}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
