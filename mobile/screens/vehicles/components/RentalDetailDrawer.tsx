import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRental, type RentalStatus } from "@/services/api.rental";
import type { Rental } from "../types";
import {
  formatPrice,
  formatDate,
  getRentalStatusColor,
  getRentalStatusLabel,
} from "../utils";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";

interface RentalDetailDrawerProps {
  visible: boolean;
  rental: Rental | null;
  onClose: () => void;
  showOwnerActions?: boolean;
}

export default function RentalDetailDrawer({
  visible,
  rental,
  onClose,
  showOwnerActions = false,
}: RentalDetailDrawerProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isOwner = showOwnerActions && user?.id === rental?.ownerId;

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      reason,
    }: {
      status: RentalStatus;
      reason?: string;
    }) => {
      if (!rental) throw new Error("Rental not found");
      return apiRental.updateRentalStatus(rental.id, {
        status,
        cancelReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRentals"] });
      Alert.alert("Thành công", "Trạng thái đơn thuê đã được cập nhật");
      setShowCancelModal(false);
      setCancelReason("");
      onClose();
    },
    onError: (error: any) => {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật trạng thái");
    },
  });

  const handleApprove = () => {
    if (!rental) return;
    Alert.alert(
      "Xác nhận đơn thuê",
      "Bạn có chắc chắn muốn xác nhận đơn thuê này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: () => {
            updateStatusMutation.mutate({ status: "CONFIRMED" });
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!rental || !cancelReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do hủy");
      return;
    }
    updateStatusMutation.mutate({
      status: "CANCELLED",
      reason: cancelReason.trim(),
    });
  };

  const handleStatusUpdate = (newStatus: RentalStatus) => {
    if (!rental) return;
    updateStatusMutation.mutate({ status: newStatus });
  };

  if (!rental) return null;

  // Check if owner can perform actions
  const canApprove = isOwner && rental.status === "AWAIT_APPROVAL";
  const canUpdateToOnTrip = isOwner && rental.status === "CONFIRMED";
  const canUpdateToCompleted = isOwner && rental.status === "ON_TRIP";
  const canCancel =
    isOwner &&
    (rental.status === "AWAIT_APPROVAL" ||
      rental.status === "CONFIRMED" ||
      rental.status === "ON_TRIP");

  const primaryImage =
    rental.vehicle.images?.find((img) => img.isPrimary)?.url ||
    rental.vehicle.images?.[0]?.url ||
    "https://via.placeholder.com/300x200?text=No+Image";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">
            Chi tiết đơn thuê
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Vehicle Image */}
          <View className="w-full h-48 bg-gray-200">
            <Image
              source={{ uri: primaryImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          <View className="px-4 pt-4">
            {/* Vehicle Info */}
            <View className="mb-4">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {rental.vehicle.brand} {rental.vehicle.model}
              </Text>
              <Text className="text-sm text-gray-600 mb-2">
                Biển số: {rental.vehicle.licensePlate}
              </Text>
              <View
                className={`self-start px-3 py-1 rounded-full ${getRentalStatusColor(
                  rental.status
                )}`}
              >
                <Text className="text-xs font-medium">
                  {getRentalStatusLabel(rental.status)}
                </Text>
              </View>
            </View>

            {/* Rental Period */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Thời gian thuê
              </Text>
              <View className="flex-row items-center mb-2">
                <MaterialIcons
                  name="calendar-today"
                  size={20}
                  color="#6B7280"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Ngày bắt đầu</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {formatDate(rental.startDate)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="event" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Ngày kết thúc</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {formatDate(rental.endDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Price Breakdown */}
            <View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Chi tiết giá
              </Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Giá cơ bản</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatPrice(
                    Number(rental.pricePerDay) *
                      Math.ceil(rental.durationMinutes / (60 * 24))
                  )}
                </Text>
              </View>

              {rental.deliveryFee > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Phí giao xe</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatPrice(rental.deliveryFee)}
                  </Text>
                </View>
              )}

              {rental.discountAmount > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Giảm giá</Text>
                  <Text className="text-sm font-medium text-green-600">
                    -{formatPrice(rental.discountAmount)}
                  </Text>
                </View>
              )}

              <View className="border-t border-orange-200 pt-2 mt-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-base font-bold text-gray-900">
                    Tổng cộng
                  </Text>
                  <Text className="text-lg font-bold text-orange-600">
                    {formatPrice(rental.totalPrice)}
                  </Text>
                </View>

                {rental.depositPrice > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Tiền cọc</Text>
                    <Text className="text-sm font-medium text-gray-900">
                      {formatPrice(rental.depositPrice)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Additional Info */}
            {rental.cancelReason && (
              <View className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
                <Text className="text-sm font-semibold text-red-900 mb-2">
                  Lý do hủy
                </Text>
                <Text className="text-sm text-red-700">
                  {rental.cancelReason}
                </Text>
              </View>
            )}

            {/* Rental Info */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Thông tin đơn thuê
              </Text>

              <View className="flex-row items-center mb-2">
                <MaterialIcons name="access-time" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Thời lượng</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {Math.ceil(rental.durationMinutes / (60 * 24))} ngày
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-2">
                <MaterialIcons name="today" size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-gray-600">Ngày tạo đơn</Text>
                  <Text className="text-base font-medium text-gray-900">
                    {formatDate(rental.createdAt)}
                  </Text>
                </View>
              </View>

              {rental.startOdometer !== undefined &&
                rental.startOdometer !== null && (
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="speed" size={20} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-600">
                        Số km bắt đầu
                      </Text>
                      <Text className="text-base font-medium text-gray-900">
                        {rental.startOdometer.toLocaleString("vi-VN")} km
                      </Text>
                    </View>
                  </View>
                )}

              {rental.endOdometer !== undefined &&
                rental.endOdometer !== null && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="speed" size={20} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-gray-600">
                        Số km kết thúc
                      </Text>
                      <Text className="text-base font-medium text-gray-900">
                        {rental.endOdometer.toLocaleString("vi-VN")} km
                      </Text>
                    </View>
                  </View>
                )}
            </View>

            {/* Owner Actions */}
            {isOwner &&
              (canApprove ||
                canUpdateToOnTrip ||
                canUpdateToCompleted ||
                canCancel) && (
                <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    Hành động
                  </Text>

                  {canApprove && (
                    <TouchableOpacity
                      onPress={handleApprove}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 rounded-xl p-3 mb-2"
                    >
                      <View className="flex-row items-center justify-center">
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 text-base font-semibold text-white">
                          Xác nhận đơn thuê
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {canUpdateToOnTrip && (
                    <TouchableOpacity
                      onPress={() => handleStatusUpdate("ON_TRIP")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-blue-600 rounded-xl p-3 mb-2"
                    >
                      <View className="flex-row items-center justify-center">
                        <MaterialIcons
                          name="directions-bike"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 text-base font-semibold text-white">
                          Bắt đầu chuyến đi
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {canUpdateToCompleted && (
                    <TouchableOpacity
                      onPress={() => handleStatusUpdate("COMPLETED")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-purple-600 rounded-xl p-3 mb-2"
                    >
                      <View className="flex-row items-center justify-center">
                        <MaterialIcons
                          name="check-circle-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 text-base font-semibold text-white">
                          Hoàn thành đơn thuê
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {canCancel && (
                    <TouchableOpacity
                      onPress={handleCancel}
                      disabled={updateStatusMutation.isPending}
                      className="bg-red-600 rounded-xl p-3"
                    >
                      <View className="flex-row items-center justify-center">
                        <MaterialIcons
                          name="cancel"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text className="ml-2 text-base font-semibold text-white">
                          Hủy đơn thuê
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {updateStatusMutation.isPending && (
                    <View className="mt-2 items-center">
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                  )}
                </View>
              )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Hủy đơn thuê
            </Text>

            <Text className="text-sm text-gray-600 mb-3">
              Vui lòng nhập lý do hủy đơn thuê:
            </Text>

            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Nhập lý do hủy..."
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
              textAlignVertical="top"
            />

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={updateStatusMutation.isPending}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
              >
                <Text className="text-center font-medium text-gray-700">
                  Hủy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmCancel}
                disabled={
                  updateStatusMutation.isPending || !cancelReason.trim()
                }
                className="flex-1 py-3 px-4 rounded-lg bg-red-600"
                style={{
                  opacity:
                    updateStatusMutation.isPending || !cancelReason.trim()
                      ? 0.5
                      : 1,
                }}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center font-medium text-white">
                    Xác nhận hủy
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
