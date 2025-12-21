import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiVehicle } from "@/services/api.vehicle";
import { vehicleStatusLabels } from "../types";
import type { Vehicle } from "../types";
import { COLORS } from "@/constants/colors";

interface ChangeVehicleStatusModalProps {
  visible: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

type VehicleStatus = Vehicle["status"];

// Định nghĩa các trạng thái có thể chuyển đổi từ trạng thái hiện tại
const getAllowedStatuses = (currentStatus: VehicleStatus): VehicleStatus[] => {
  const allowedTransitions: Record<VehicleStatus, VehicleStatus[]> = {
    DRAFT: ["PENDING"],
    PENDING: [], // Không thể thay đổi từ PENDING
    APPROVED: ["HIDDEN", "MAINTENANCE"],
    REJECTED: ["PENDING"],
    HIDDEN: ["APPROVED"],
    MAINTENANCE: ["APPROVED"],
  };
  return allowedTransitions[currentStatus] || [];
};

export default function ChangeVehicleStatusModal({
  visible,
  vehicle,
  onClose,
}: ChangeVehicleStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | null>(
    null
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: VehicleStatus) => {
      if (!vehicle) throw new Error("Vehicle not found");
      return apiVehicle.updateVehicleStatus(vehicle.id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myVehicles"] });
      Alert.alert("Thành công", "Trạng thái xe đã được cập nhật");
      onClose();
      setSelectedStatus(null);
    },
    onError: (error: any) => {
      Alert.alert(
        "Lỗi",
        error?.message || "Không thể thay đổi trạng thái xe. Vui lòng thử lại."
      );
    },
  });

  if (!vehicle) return null;

  const allowedStatuses = getAllowedStatuses(vehicle.status);
  const currentStatusLabel = vehicleStatusLabels[vehicle.status];

  const handleConfirm = () => {
    if (!selectedStatus) {
      Alert.alert("Lỗi", "Vui lòng chọn trạng thái mới");
      return;
    }
    mutation.mutate(selectedStatus);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setSelectedStatus(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl w-full max-w-md p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Thay đổi trạng thái xe
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={mutation.isPending}
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">
              Xe: {vehicle.brand} {vehicle.model}
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Trạng thái hiện tại:{" "}
              <Text className="font-semibold">{currentStatusLabel}</Text>
            </Text>
          </View>

          {allowedStatuses.length === 0 ? (
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <Text className="text-yellow-800 text-sm">
                Không thể thay đổi trạng thái từ &quot;{currentStatusLabel}
                &quot;. Xe đang chờ được duyệt hoặc không có trạng thái hợp lệ
                để chuyển đổi.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Chọn trạng thái mới:
              </Text>
              <View className="mb-6">
                {allowedStatuses.map((status) => {
                  const isSelected = selectedStatus === status;
                  const statusLabel = vehicleStatusLabels[status];
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setSelectedStatus(status)}
                      disabled={mutation.isPending}
                      className={`mb-2 p-4 rounded-lg border-2 ${
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`font-medium ${
                            isSelected ? "text-primary-700" : "text-gray-700"
                          }`}
                        >
                          {statusLabel}
                        </Text>
                        {isSelected && (
                          <MaterialIcons
                            name="check-circle"
                            size={24}
                            color={COLORS.primary}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={mutation.isPending}
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
                >
                  <Text className="text-center font-medium text-gray-700">
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={mutation.isPending || !selectedStatus}
                  className="flex-1 py-3 px-4 rounded-lg bg-primary-600"
                  style={{
                    opacity: mutation.isPending || !selectedStatus ? 0.5 : 1,
                  }}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-center font-medium text-white">
                      Xác nhận
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
