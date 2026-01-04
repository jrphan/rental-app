import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRefreshControl } from "@/hooks/useRefreshControl";
import * as ImagePicker from "expo-image-picker";
import HeaderBase from "@/components/header/HeaderBase";
import { apiCommission, OwnerCommission } from "@/services/api.commission";
import { formatCurrency } from "@/utils/currency";
import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useToast } from "@/hooks/useToast";
import { useUploadUserFile } from "@/hooks/files/useUserFiles";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Chờ thanh toán";
    case "PAID":
      return "Đã gửi hóa đơn";
    case "APPROVED":
      return "Đã xác thực";
    case "REJECTED":
      return "Đã từ chối";
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "text-amber-600";
    case "PAID":
      return "text-blue-600";
    case "APPROVED":
      return "text-green-600";
    case "REJECTED":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

interface CommissionCardProps {
  commission: OwnerCommission;
  onUploadInvoice: (commission: OwnerCommission) => void;
}

function CommissionCard({ commission, onUploadInvoice }: CommissionCardProps) {
  const statusLabel = getStatusLabel(commission.paymentStatus);
  const statusColor = getStatusColor(commission.paymentStatus);
  const canUploadInvoice =
    commission.paymentStatus === "PENDING" &&
    parseFloat(commission.commissionAmount) > 0;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-sm text-gray-600 mb-1">
            Tuần {formatDate(commission.weekStartDate)} -{" "}
            {formatDate(commission.weekEndDate)}
          </Text>
          <Text className="text-lg font-semibold text-gray-900">
            {formatCurrency(commission.commissionAmount)} đ
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Từ {commission.rentalCount} đơn thuê • Tổng thu nhập:{" "}
            {formatCurrency(commission.totalEarning)} đ
          </Text>
          <View className="mt-2 pt-2 border-t border-gray-100">
            {/* [FIX] Sửa lại phần giải thích cách tính */}
            <Text className="text-xs text-gray-600">
              💡 Số tiền thanh toán bao gồm:
            </Text>
            <View className="ml-2 mt-1">
              <Text className="text-xs text-gray-500">
                + Phí nền tảng ({(parseFloat(commission.commissionRate) * 100).toFixed(0)}%)
              </Text>
              <Text className="text-xs text-gray-500">
                + Thu hộ phí bảo hiểm (trả lại nền tảng)
              </Text>
              <Text className="text-xs text-green-600">
                - Sàn hỗ trợ mã giảm giá (nếu có)
              </Text>
            </View>
            <Text className="text-xs font-semibold text-gray-700 mt-1">
              = {formatCurrency(commission.commissionAmount)} đ
            </Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${commission.paymentStatus === "PENDING"
            ? "bg-amber-100"
            : commission.paymentStatus === "PAID"
              ? "bg-blue-100"
              : commission.paymentStatus === "APPROVED"
                ? "bg-green-100"
                : "bg-red-100"
            }`}
        >
          <Text className={`text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {commission.payment && commission.payment.invoiceUrl && (
        <View className="mb-3 p-2 bg-gray-50 rounded-lg">
          <Text className="text-xs text-gray-600 mb-2">Hóa đơn đã upload:</Text>
          <Image
            source={{ uri: commission.payment.invoiceUrl }}
            style={{ width: "100%", height: 200, borderRadius: 8 }}
            resizeMode="contain"
          />
          {commission.payment.status === "REJECTED" &&
            commission.payment.adminNotes && (
              <View className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                <Text className="text-xs font-medium text-red-800 mb-1">
                  Lý do từ chối:
                </Text>
                <Text className="text-xs text-red-700">
                  {commission.payment.adminNotes}
                </Text>
              </View>
            )}
        </View>
      )}

      {canUploadInvoice && (
        <TouchableOpacity
          onPress={() => onUploadInvoice(commission)}
          className="bg-orange-500 rounded-xl py-3 px-4 flex-row items-center justify-center"
        >
          <MaterialIcons name="upload-file" size={20} color="#FFF" />
          <Text className="text-white font-semibold ml-2">
            Tải hóa đơn thanh toán
          </Text>
        </TouchableOpacity>
      )}

      {commission.paymentStatus === "APPROVED" && (
        <View className="bg-green-50 rounded-lg p-2 mt-2">
          <Text className="text-xs text-green-800">✓ Đã được admin duyệt</Text>
        </View>
      )}
    </View>
  );
}

interface UploadInvoiceModalProps {
  commission: OwnerCommission | null;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadInvoiceModal({
  commission,
  onClose,
  onSuccess,
}: UploadInvoiceModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const uploadFile = useUploadUserFile("invoices");
  const [isUploading, setIsUploading] = useState(false);

  const uploadInvoiceMutation = useMutation({
    mutationFn: (fileId: string) => {
      if (!commission) throw new Error("Commission không tồn tại");
      return apiCommission.uploadInvoice(commission.id, {
        invoiceFileId: fileId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      queryClient.invalidateQueries({ queryKey: ["currentWeekCommission"] });
      toast.showSuccess("Đã upload hóa đơn thành công", {
        title: "Thành công",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast.showError(error?.message || "Upload hóa đơn thất bại", {
        title: "Lỗi",
      });
    },
  });

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setIsUploading(true);
      const asset = result.assets[0];
      const uploadedFile = await uploadFile.mutateAsync({
        uri: asset.uri,
        name: asset.fileName || "invoice.jpg",
        type: asset.mimeType || "image/jpeg",
      });

      await uploadInvoiceMutation.mutateAsync(uploadedFile.id);
    } catch (error: any) {
      if (!error.message?.includes("Thành công")) {
        Alert.alert("Lỗi", error?.message || "Không thể upload hóa đơn");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!commission) return null;

  return (
    <Modal
      visible={!!commission}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-900">
            Upload hóa đơn thanh toán
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
        >
          <Text className="text-sm text-gray-600 mb-4">
            Vui lòng chụp hoặc upload hóa đơn thanh toán cho số tiền:{" "}
            <Text className="font-semibold text-gray-900">
              {formatCurrency(commission.commissionAmount)} đ
            </Text>
          </Text>

          {isUploading || uploadInvoiceMutation.isPending ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text className="text-sm text-gray-600 mt-4">Đang upload...</Text>
            </View>
          ) : (
            <View>
              <TouchableOpacity
                onPress={handlePickImage}
                className="bg-orange-500 rounded-xl py-3 px-4 flex-row items-center justify-center mb-3"
              >
                <MaterialIcons name="photo-library" size={20} color="#FFF" />
                <Text className="text-white font-semibold ml-2">
                  Chọn ảnh từ thư viện
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="bg-gray-200 rounded-xl py-3 px-4"
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Hủy
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function CommissionsScreen() {
  const [selectedCommission, setSelectedCommission] =
    useState<OwnerCommission | null>(null);

  const {
    data: currentCommission,
    isLoading: isLoadingCurrent,
    refetch: refetchCurrent,
    isRefetching: isRefetchingCurrent,
  } = useQuery({
    queryKey: ["currentWeekCommission"],
    queryFn: () => apiCommission.getCurrentWeekCommission(),
  });

  const {
    data: commissionsData,
    isLoading: isLoadingList,
    refetch: refetchList,
    isRefetching: isRefetchingList,
  } = useQuery({
    queryKey: ["commissions"],
    queryFn: () => apiCommission.getMyCommissions(20, 0),
  });


  console.log("commissionsData", commissionsData);

  const isLoading = isLoadingCurrent || isLoadingList;

  const { refreshControl } = useRefreshControl({
    queryKeys: [["currentWeekCommission"], ["commissions"]],
    refetchFunctions: [refetchCurrent, refetchList],
  });

  const handleUploadInvoice = (commission: OwnerCommission) => {
    setSelectedCommission(commission);
  };

  const handleCloseModal = () => {
    setSelectedCommission(null);
  };

  const handleUploadSuccess = () => {
    setSelectedCommission(null);
    refetchCurrent();
    refetchList();
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Chiết khấu" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allCommissions = [
    ...(currentCommission &&
      !commissionsData?.items.find((c) => c.id === currentCommission.id)
      ? [currentCommission]
      : []),
    ...(commissionsData?.items || []),
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <HeaderBase title="Chiết khấu" showBackButton />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={refreshControl}
      >
        {currentCommission &&
          parseFloat(currentCommission.commissionAmount) > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Tuần trước (Cần thanh toán)
              </Text>
              <CommissionCard
                commission={currentCommission}
                onUploadInvoice={handleUploadInvoice}
              />
              {/* Hiển thị cảnh báo nếu đang trong thời gian yêu cầu thanh toán */}
              {(() => {
                const now = new Date();
                const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
                const isPaymentPeriod = dayOfWeek >= 1 && dayOfWeek <= 3; // Thứ 2-4

                if (isPaymentPeriod) {
                  return (
                    <View className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <Text className="text-xs font-medium text-amber-900">
                        ⚠️ Thời gian yêu cầu thanh toán: Thứ 2 - Thứ 4 hằng tuần
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </View>
          )}

        {allCommissions.length > (currentCommission ? 1 : 0) && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Lịch sử chiết khấu
            </Text>
            {allCommissions
              .filter((c) => c.id !== currentCommission?.id)
              .map((commission) => (
                <CommissionCard
                  key={commission.id}
                  commission={commission}
                  onUploadInvoice={handleUploadInvoice}
                />
              ))}
          </View>
        )}

        {allCommissions.length === 0 && (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="receipt-long" size={64} color="#9CA3AF" />
            <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
              Chưa có chiết khấu
            </Text>
            <Text className="text-sm text-gray-600 text-center px-4">
              Chiết khấu sẽ được tính toán vào cuối mỗi tuần dựa trên các đơn
              thuê đã hoàn thành.
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedCommission && (
        <UploadInvoiceModal
          commission={selectedCommission}
          onClose={handleCloseModal}
          onSuccess={handleUploadSuccess}
        />
      )}
    </SafeAreaView>
  );
}
