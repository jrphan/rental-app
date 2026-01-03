import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import HeaderBase from "@/components/header/HeaderBase";
import { apiCommission, RevenueItem } from "@/services/api.commission";
import { useRefreshControl } from "@/hooks/useRefreshControl";
import { formatCurrency } from "@/utils/currency";
import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { DatePicker } from "@/components/ui/date-picker";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

interface RevenueCardProps {
  item: RevenueItem;
}

function RevenueCard({ item }: RevenueCardProps) {
  const platformFee = item.platformFee || "0";
  // const deliveryFee = item.deliveryFee || "0";
  const insuranceFee = item.insuranceFee || "0";
  const discountAmount = item.discountAmount || "0";

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 mb-1">
            {item.vehicleBrand} {item.vehicleModel}
          </Text>
          <Text className="text-sm text-gray-600">
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-green-600">
            +{formatCurrency(item.ownerEarning)} đ
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Tổng: {formatCurrency(item.totalPrice)} đ
          </Text>
        </View>
      </View>
      
      {/* Breakdown */}
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs font-semibold text-gray-700 mb-2">
          Chi tiết thanh toán:
        </Text>
        
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-600">Tổng tiền khách trả:</Text>
          <Text className="text-xs font-medium text-gray-900">
            {formatCurrency(item.totalPrice)} đ
          </Text>
        </View>
        
        {parseFloat(platformFee) > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-600">Phí nền tảng (15%):</Text>
            <Text className="text-xs font-medium text-red-600">
              -{formatCurrency(platformFee)} đ
            </Text>
          </View>
        )}
        
        {parseFloat(insuranceFee) > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-600">Phí bảo hiểm:</Text>
            <Text className="text-xs font-medium text-gray-600">
              -{formatCurrency(insuranceFee)} đ
            </Text>
          </View>
        )}
        
        {parseFloat(discountAmount) > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-600">Giảm giá:</Text>
            <Text className="text-xs font-medium text-green-600">
              +{formatCurrency(discountAmount)} đ
            </Text>
          </View>
        )}
        
        {/* {parseFloat(deliveryFee) > 0 && (
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-600">Phí giao xe:</Text>
            <Text className="text-xs font-medium text-blue-600">
              +{formatCurrency(deliveryFee)} đ
            </Text>
          </View>
        )} */}
        
        <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
          <Text className="text-sm font-semibold text-gray-900">Thu nhập của bạn:</Text>
          <Text className="text-sm font-bold text-green-600">
            {formatCurrency(item.ownerEarning)} đ
          </Text>
        </View>
        
        <View className="mt-2 pt-2 border-t border-gray-100 bg-gray-50 rounded-lg p-2">
          <Text className="text-xs text-gray-600">
            💡 <Text className="font-medium">Giải thích:</Text> Thu nhập = Tổng tiền - Phí nền tảng (15%) - Phí bảo hiểm + Giảm giá
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function RevenueScreen() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const parseLocalDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const startDateObj = useMemo(
    () => parseLocalDate(startDate),
    [startDate]
  );
  const endDateObj = useMemo(() => parseLocalDate(endDate), [endDate]);

  const {
    data: revenueData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["revenue", startDateObj, endDateObj],
    queryFn: () =>
      apiCommission.getRevenue(startDateObj, endDateObj, 100, 0),
    enabled: true,
  });

  const { refreshControl } = useRefreshControl({
    queryKeys: [["revenue"]],
    refetchFunctions: [refetch],
  });

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <HeaderBase title="Doanh thu" showBackButton />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={refreshControl}
      >
        {/* Filter Section */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              Lọc theo thời gian
            </Text>
            {(startDate || endDate) && (
              <TouchableOpacity
                onPress={handleClearFilter}
                className="px-3 py-1 bg-gray-100 rounded-lg"
              >
                <Text className="text-sm text-gray-700">Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <DatePicker
                label="Từ ngày"
                value={startDate}
                onChange={setStartDate}
                placeholder="Chọn ngày bắt đầu"
                mode="date"
                allowClear
                maximumDate={endDateObj || undefined}
              />
            </View>
            <View className="flex-1">
              <DatePicker
                label="Đến ngày"
                value={endDate}
                onChange={setEndDate}
                placeholder="Chọn ngày kết thúc"
                mode="date"
                allowClear
                minimumDate={startDateObj || undefined}
              />
            </View>
          </View>
        </View>

        {/* Summary Section */}
        {revenueData && (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Tổng quan
            </Text>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Tổng doanh thu:</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatCurrency(revenueData.totalRevenue)} đ
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-gray-600">Thu nhập của bạn:</Text>
              <Text className="text-base font-semibold text-green-600">
                {formatCurrency(revenueData.totalEarning)} đ
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-600">Số đơn thuê:</Text>
              <Text className="text-base font-semibold text-gray-900">
                {revenueData.total}
              </Text>
            </View>
          </View>
        )}

        {/* Revenue List */}
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-4 text-gray-600">Đang tải...</Text>
          </View>
        ) : revenueData && revenueData.items.length > 0 ? (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Danh sách đơn thuê ({revenueData.items.length})
            </Text>
            {revenueData.items.map((item) => (
              <RevenueCard key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="attach-money" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
              Chưa có doanh thu
            </Text>
            <Text className="text-sm text-gray-600 text-center px-4">
              {startDate || endDate
                ? "Không có doanh thu trong khoảng thời gian đã chọn."
                : "Doanh thu sẽ được hiển thị khi có đơn thuê hoàn thành."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

