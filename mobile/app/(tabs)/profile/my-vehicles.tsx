import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi, VehicleItem } from "@/services/api.vehicles";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { useToast } from "@/hooks/useToast";

export default function MyVehiclesScreen() {
  const router = useRouter();
  const toast = useToast();

  const queryClient = useQueryClient();
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["my-vehicles"],
    queryFn: () => vehiclesApi.getMyVehicles(),
  });

  const submitMutation = useMutation({
    mutationFn: (vehicleId: string) => vehiclesApi.submit(vehicleId),
    onSuccess: () => {
      toast.showSuccess("Đã gửi yêu cầu duyệt xe", { title: "Thành công" });
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Gửi duyệt thất bại", { title: "Lỗi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicleId: string) => vehiclesApi.delete(vehicleId),
    onSuccess: () => {
      toast.showSuccess("Đã xóa xe", { title: "Thành công" });
      queryClient.invalidateQueries({ queryKey: ["my-vehicles"] });
    },
    onError: (e: any) => {
      toast.showError(e?.message || "Xóa xe thất bại", { title: "Lỗi" });
    },
  });

  const handleSubmit = (vehicleId: string) => {
    Alert.alert(
      "Gửi yêu cầu duyệt",
      "Bạn có chắc muốn gửi xe này để admin duyệt? Xe cần có ít nhất 1 hình ảnh.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi duyệt",
          onPress: () => submitMutation.mutate(vehicleId),
        },
      ]
    );
  };

  const handleDelete = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      "Xóa xe",
      `Bạn có chắc muốn xóa xe "${vehicleName}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteMutation.mutate(vehicleId),
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; bgColor: string }
    > = {
      DRAFT: { label: "Bản nháp", color: "#6B7280", bgColor: "#F3F4F6" },
      SUBMITTED: { label: "Chờ duyệt", color: "#F59E0B", bgColor: "#FEF3C7" },
      VERIFIED: { label: "Đã duyệt", color: "#22C55E", bgColor: "#D1FAE5" },
      REJECTED: { label: "Từ chối", color: "#EF4444", bgColor: "#FEE2E2" },
    };
    return statusConfig[status] || statusConfig.DRAFT;
  };

  const renderItem = ({
    item,
  }: {
    item: VehicleItem & { images?: { url: string }[] };
  }) => {
    const statusBadge = getStatusBadge(item.status);
    const primaryImage = item.images?.[0]?.url;

    return (
      <TouchableOpacity
        className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
        onPress={() => {
          // TODO: Navigate to vehicle detail/edit screen
          toast.showInfo("Tính năng đang phát triển", { title: "Thông báo" });
        }}
      >
        <View className="flex-row">
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              className="w-24 h-24 rounded-lg mr-4"
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-24 rounded-lg mr-4 bg-gray-100 items-center justify-center">
              <MaterialIcons name="directions-bike" size={40} color="#9CA3AF" />
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-gray-900 flex-1">
                {item.brand} {item.model}
              </Text>
              <View
                className="px-2 py-1 rounded"
                style={{ backgroundColor: statusBadge.bgColor }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusBadge.color }}
                >
                  {statusBadge.label}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-gray-600 mb-1">
              Năm: {item.year} • Màu: {item.color}
            </Text>
            <Text className="text-sm text-gray-600 mb-1">
              Biển số: {item.licensePlate}
            </Text>
            <Text className="text-sm font-semibold text-orange-600">
              {Number(item.dailyRate).toLocaleString("vi-VN")} đ/ngày
            </Text>

            {item.status === "DRAFT" && (
              <View className="mt-2 flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-lg px-3 py-2 items-center"
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({
                      pathname: "/(tabs)/profile/vehicle-create",
                      params: { vehicleId: item.id },
                    });
                  }}
                >
                  <Text className="text-gray-700 text-xs font-semibold">
                    Chỉnh sửa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-orange-600 rounded-lg px-3 py-2 items-center"
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSubmit(item.id);
                  }}
                  disabled={submitMutation.isPending}
                >
                  <Text className="text-white text-xs font-semibold">
                    {submitMutation.isPending ? "Đang gửi..." : "Gửi duyệt"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(item.status === "DRAFT" || item.status === "REJECTED") && (
              <View className="mt-2">
                <TouchableOpacity
                  className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 items-center"
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id, `${item.brand} ${item.model}`);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="delete" size={16} color="#EF4444" />
                    <Text className="text-red-600 text-xs font-semibold">
                      {deleteMutation.isPending ? "Đang xóa..." : "Xóa xe"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {item.status === "SUBMITTED" && (
              <View className="mt-2 flex-row items-center">
                <MaterialIcons name="schedule" size={16} color="#F59E0B" />
                <Text className="ml-1 text-xs text-gray-600">
                  Đang chờ admin duyệt
                </Text>
              </View>
            )}

            {item.status === "VERIFIED" && (
              <View className="mt-2 flex-row items-center">
                <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                <Text className="ml-1 text-xs text-green-600">
                  Xe đã được duyệt và hiển thị công khai
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 flex-1">
            Xe của tôi
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/vehicle-create")}
            className="ml-3"
          >
            <MaterialIcons name="add-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-4 text-gray-600">Đang tải...</Text>
          </View>
        ) : !vehicles || vehicles.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="directions-bike" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-lg font-semibold text-gray-900">
              Chưa có xe nào
            </Text>
            <Text className="mt-2 text-sm text-gray-600 text-center px-8">
              Bạn chưa đăng ký xe nào. Hãy đăng xe mới để bắt đầu cho thuê!
            </Text>
            <TouchableOpacity
              className="mt-6 bg-orange-600 rounded-lg px-6 py-3"
              onPress={() => router.push("/(tabs)/profile/vehicle-create")}
            >
              <Text className="text-white font-semibold">Đăng xe mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
