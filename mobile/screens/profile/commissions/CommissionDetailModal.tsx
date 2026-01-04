import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { apiCommission, OwnerCommission, RevenueItem } from "@/services/api.commission";
import { formatCurrency } from "@/utils/currency";
import { COLORS } from "@/constants/colors";

interface CommissionDetailModalProps {
    commission: OwnerCommission | null;
    onClose: () => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateFull(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function RentalDetailCard({ rental }: { rental: RevenueItem }) {
    const platformFee = parseFloat(rental.platformFee || "0");
    const insuranceFee = parseFloat(rental.insuranceFee || "0");
    const discountAmount = parseFloat(rental.discountAmount || "0");
    const commissionAmount = Math.max(0, platformFee + insuranceFee - discountAmount);

    return (
        <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                        {rental.vehicleBrand} {rental.vehicleModel}
                    </Text>
                    <Text className="text-xs text-gray-500">
                        {formatDateFull(rental.startDate)} - {formatDateFull(rental.endDate)}
                    </Text>
                </View>
            </View>

            <View className="border-t border-gray-100 pt-3 mt-2">
                <Text className="text-xs font-semibold text-gray-700 mb-2">
                    Chi tiết giá:
                </Text>

                <View className="mb-3">
                    <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">Tổng giá:</Text>
                        <Text className="text-xs font-medium text-gray-900">
                            {formatCurrency(rental.totalPrice)} đ
                        </Text>
                    </View>

                    <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">Phí nền tảng:</Text>
                        <Text className="text-xs font-medium text-gray-900">
                            {formatCurrency(rental.platformFee || "0")} đ
                        </Text>
                    </View>

                    <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">Phí bảo hiểm:</Text>
                        <Text className="text-xs font-medium text-gray-900">
                            {formatCurrency(rental.insuranceFee || "0")} đ
                        </Text>
                    </View>

                    {discountAmount > 0 && (
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-xs text-gray-600">Giảm giá:</Text>
                            <Text className="text-xs font-medium text-red-600">
                                -{formatCurrency(rental.discountAmount || "0")} đ
                            </Text>
                        </View>
                    )}
                </View>

                <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <Text className="text-xs font-semibold text-blue-900 mb-1">
                        Cách tính chiết khấu:
                    </Text>
                    <Text className="text-xs text-blue-800 mb-1">
                        Chiết khấu = Phí nền tảng + Phí bảo hiểm - Giảm giá
                    </Text>
                    <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-blue-200">
                        <Text className="text-sm font-semibold text-blue-900">
                            Chiết khấu đơn này:
                        </Text>
                        <Text className="text-base font-bold text-blue-900">
                            {formatCurrency(commissionAmount.toString())} đ
                        </Text>
                    </View>
                </View>

                <View className="mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row justify-between">
                        <Text className="text-xs text-gray-600">Thu nhập của bạn:</Text>
                        <Text className="text-xs font-semibold text-green-600">
                            {formatCurrency(rental.ownerEarning)} đ
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function CommissionDetailModal({
    commission,
    onClose,
}: CommissionDetailModalProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["commission-detail", commission?.id, commission?.weekStartDate, commission?.weekEndDate],
        queryFn: () => {
            if (!commission) throw new Error("Commission không tồn tại");
            return apiCommission.getRevenue(
                new Date(commission.weekStartDate),
                new Date(commission.weekEndDate),
                100,
                0
            );
        },
        enabled: !!commission,
    });

    if (!commission) return null;

    const rentals = data?.items || [];
    const totalCommission = rentals.reduce((sum, rental) => {
        const platformFee = parseFloat(rental.platformFee || "0");
        const insuranceFee = parseFloat(rental.insuranceFee || "0");
        const discountAmount = parseFloat(rental.discountAmount || "0");
        return sum + Math.max(0, platformFee + insuranceFee - discountAmount);
    }, 0);

    return (
        <Modal
            visible={!!commission}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 p-4 bg-gray-50" edges={["top"]}>
                {/* Header */}
                <View className="bg-white border-b border-gray-200">
                    <View className="flex-row items-center justify-between px-4 py-3">
                        <Text className="text-lg font-bold text-gray-900">
                            Chi tiết tuần {formatDate(commission.weekStartDate)} -{" "}
                            {formatDate(commission.weekEndDate)}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Summary */}
                    <View className="px-4 pb-3">
                        <View className="bg-gray-50 rounded-lg p-3">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-sm text-gray-600">Tổng số đơn:</Text>
                                <Text className="text-sm font-semibold text-gray-900">
                                    {rentals.length} đơn
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-sm text-gray-600">Tổng chiết khấu:</Text>
                                <Text className="text-base font-bold text-orange-600">
                                    {formatCurrency(totalCommission.toString())} đ
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm text-gray-600">Tổng thu nhập:</Text>
                                <Text className="text-sm font-semibold text-green-600">
                                    {formatCurrency(commission.totalEarning)} đ
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoading ? (
                        <View className="py-12 items-center">
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text className="text-sm text-gray-600 mt-4">Đang tải...</Text>
                        </View>
                    ) : error ? (
                        <View className="py-12 items-center">
                            <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                            <Text className="text-sm text-gray-600 mt-4">
                                Không thể tải dữ liệu
                            </Text>
                        </View>
                    ) : rentals.length === 0 ? (
                        <View className="py-12 items-center">
                            <MaterialIcons name="receipt-long" size={48} color="#9CA3AF" />
                            <Text className="text-sm text-gray-600 mt-4">
                                Không có đơn nào trong tuần này
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text className="text-base font-semibold text-gray-900 mb-3">
                                Danh sách đơn ({rentals.length})
                            </Text>
                            {rentals.map((rental) => (
                                <RentalDetailCard key={rental.id} rental={rental} />
                            ))}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

