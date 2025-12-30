import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import { openExternalMaps } from "@/utils/maps";
import OwnerInfo from "./components/OwnerInfo";
import VehicleImageCarousel from "./components/VehicleImageCarousel";
import { apiRental, type RentalStatus } from "@/services/api.rental";
import { apiReview } from "@/services/api.review";
import {
  formatPrice,
  formatDate,
  getRentalStatusColor,
  getRentalStatusLabel,
} from "./utils";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";

export default function RentalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");

  // Fetch rental detail
  const { data: rentalData, isLoading } = useQuery({
    queryKey: ["rental", id],
    queryFn: () => {
      if (!id) throw new Error("Rental ID is required");
      return apiRental.getRentalDetail(id);
    },
    enabled: !!id,
  });

  const rental = rentalData?.rental;

  // Fetch rental reviews to check if user has already reviewed
  const { data: rentalReviewsData } = useQuery({
    queryKey: ["rentalReviews", id],
    queryFn: () => {
      if (!id) throw new Error("Rental ID is required");
      return apiReview.getRentalReviews(id);
    },
    enabled: !!id && !!rental,
  });

  const showOwnerActions = true; // Can be passed as prop or determined from context
  const isOwner = showOwnerActions && user?.id === rental?.ownerId;
  const isRenter = user?.id === rental?.renterId;
  const hasReviewed = rentalReviewsData?.userHasReviewed || false;
  const canReview = isRenter && rental?.status === "COMPLETED" && !hasReviewed;

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
      queryClient.invalidateQueries({ queryKey: ["rental", id] });
      Alert.alert("Thành công", "Trạng thái đơn thuê đã được cập nhật");
      setShowCancelModal(false);
      setCancelReason("");
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

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; content?: string }) => {
      if (!rental) throw new Error("Rental not found");
      return apiReview.createReview({
        rentalId: rental.id,
        type: "RENTER_TO_VEHICLE",
        rating: data.rating,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental", id] });
      queryClient.invalidateQueries({ queryKey: ["rentalReviews", id] });
      queryClient.invalidateQueries({
        queryKey: ["vehicleReviews", rental?.vehicleId],
      });
      Alert.alert("Thành công", "Đánh giá của bạn đã được gửi");
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewContent("");
    },
    onError: (error: any) => {
      Alert.alert("Lỗi", error.message || "Không thể gửi đánh giá");
    },
  });

  const handleSubmitReview = () => {
    if (reviewRating === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn số sao đánh giá");
      return;
    }
    createReviewMutation.mutate({
      rating: reviewRating,
      content: reviewContent.trim() || undefined,
    });
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onPress?: (rating: number) => void
  ) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={interactive && onPress ? () => onPress(star) : undefined}
            disabled={!interactive}
            activeOpacity={interactive ? 0.7 : 1}
          >
            <MaterialIcons
              name={star <= rating ? "star" : "star-border"}
              size={interactive ? 32 : 20}
              color={star <= rating ? "#F59E0B" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Chi tiết đơn thuê" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rental) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Chi tiết đơn thuê" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-red-600 text-center">
            Không tìm thấy thông tin đơn thuê
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if owner can perform actions
  const canApprove = isOwner && rental.status === "AWAIT_APPROVAL";
  const canUpdateToOnTrip = isOwner && rental.status === "CONFIRMED";
  const canUpdateToCompleted = isOwner && rental.status === "ON_TRIP";
  const canCancel =
    isOwner &&
    (rental.status === "AWAIT_APPROVAL" ||
      rental.status === "CONFIRMED" ||
      rental.status === "ON_TRIP");

  // Convert vehicle images to VehicleImage format
  const vehicleImages =
    rental.vehicle.images?.map((img) => ({
      id: img.id || "",
      url: img.url,
      isPrimary: img.isPrimary || false,
      order: img.order || 0,
    })) || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Chi tiết đơn thuê" showBackButton />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel */}
        <VehicleImageCarousel images={vehicleImages} height={320} />

        {/* Content */}
        <View className="px-4 pt-4">
          {/* Header */}
          <View className="mt-4 mb-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {rental.vehicle.brand} {rental.vehicle.model}
                </Text>
                {(rental.vehicle as any).year &&
                  (rental.vehicle as any).color && (
                    <Text className="text-base text-gray-600 mt-1">
                      Năm {(rental.vehicle as any).year} •{" "}
                      {(rental.vehicle as any).color}
                    </Text>
                  )}
              </View>
              <View
                className={`px-3 py-1 rounded-full ${getRentalStatusColor(rental.status)}`}
              >
                <Text className="text-xs font-medium">
                  {getRentalStatusLabel(rental.status)}
                </Text>
              </View>
            </View>

            {/* License Plate */}
            <View className="flex-row items-center mt-2">
              <MaterialIcons
                name="confirmation-number"
                size={20}
                color="#6B7280"
              />
              <Text className="ml-2 text-base font-mono text-gray-700">
                {rental.vehicle.licensePlate}
              </Text>
            </View>
          </View>

          {/* Owner Info: show only when viewer is renter (not owner) */}
          {!isOwner && rental.owner && (
            <OwnerInfo owner={rental.owner} ownerId={rental.ownerId} />
          )}

          {/* Rental Period */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Thời gian thuê
            </Text>
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
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

          {/* Pickup / Delivery block */}
          {(() => {
            // Use persisted deliveryAddress (backend) if exists,
            // otherwise fall back to vehicle address (pickup)
            const deliveryAddress = rental.deliveryAddress ?? null;
            const isDelivery =
              Boolean(deliveryAddress) || Number(rental.deliveryFee) > 0;
            const displayParts = deliveryAddress
              ? {
                  fullAddress: deliveryAddress.fullAddress || "",
                  address: deliveryAddress.address || "",
                  ward: deliveryAddress.ward,
                  district: deliveryAddress.district,
                  city: deliveryAddress.city,
                  lat: deliveryAddress.lat,
                  lng: deliveryAddress.lng,
                }
              : {
                  fullAddress: rental.vehicle?.fullAddress || "",
                  address: rental.vehicle?.address || "",
                  ward: (rental.vehicle as any)?.ward,
                  district: (rental.vehicle as any)?.district,
                  city: (rental.vehicle as any)?.city,
                  lat: (rental.vehicle as any)?.lat,
                  lng: (rental.vehicle as any)?.lng,
                };
            const label = isDelivery ? "Giao xe tại" : "Nhận xe tại";
            const fullAddress =
              [
                displayParts.address,
                displayParts.ward ? `, ${displayParts.ward}` : "",
                displayParts.district ? `, ${displayParts.district}` : "",
                displayParts.city ? `, ${displayParts.city}` : "",
              ]
                .join("")
                .trim() ||
              displayParts.fullAddress ||
              "—";

            return (
              <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View style={{ flex: 1 }}>
                    <Text className="text-base font-semibold text-gray-900 mb-2">
                      {label}
                    </Text>
                    <Text className="text-sm text-gray-700">{fullAddress}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const lat = Number(displayParts.lat);
                      const lng = Number(displayParts.lng);
                      if (!isFinite(lat) || !isFinite(lng)) {
                        Alert.alert("Lỗi", "Không có tọa độ để mở chỉ đường");
                        return;
                      }
                      openExternalMaps(lat, lng, fullAddress);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name="directions"
                      size={27}
                      color="#1F8A70"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

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

            {Number(rental.deliveryFee) > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Phí giao xe</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {formatPrice(Number(rental.deliveryFee))}
                </Text>
              </View>
            )}

            {Number(rental.discountAmount) > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Giảm giá</Text>
                <Text className="text-sm font-medium text-green-600">
                  -{formatPrice(Number(rental.discountAmount))}
                </Text>
              </View>
            )}

            <View className="border-t border-orange-200 pt-2 mt-2">
              <View className="flex-row justify-between mb-2">
                <Text className="text-base font-bold text-gray-900">
                  Tổng cộng
                </Text>
                <Text className="text-lg font-bold text-orange-600">
                  {formatPrice(Number(rental.totalPrice))}
                </Text>
              </View>

              {Number(rental.depositPrice) > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-600">Tiền cọc</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {formatPrice(Number(rental.depositPrice))}
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
                    <Text className="text-sm text-gray-600">Số km bắt đầu</Text>
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
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#10B981",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#10B981"
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          color: "#10B981",
                          fontWeight: "600",
                        }}
                      >
                        Xác nhận đơn thuê
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {canUpdateToOnTrip && (
                  <TouchableOpacity
                    onPress={() => handleStatusUpdate("ON_TRIP")}
                    disabled={updateStatusMutation.isPending}
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#2563EB",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons
                        name="directions-bike"
                        size={20}
                        color="#2563EB"
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          color: "#2563EB",
                          fontWeight: "600",
                        }}
                      >
                        Bắt đầu chuyến đi
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {canUpdateToCompleted && (
                  <TouchableOpacity
                    onPress={() => handleStatusUpdate("COMPLETED")}
                    disabled={updateStatusMutation.isPending}
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#8B5CF6",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons
                        name="check-circle-outline"
                        size={20}
                        color="#8B5CF6"
                      />
                      <Text
                        style={{
                          marginLeft: 8,
                          color: "#8B5CF6",
                          fontWeight: "600",
                        }}
                      >
                        Hoàn thành đơn thuê
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {canCancel && (
                  <TouchableOpacity
                    onPress={handleCancel}
                    disabled={updateStatusMutation.isPending}
                    style={{
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#EF4444",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons name="cancel" size={20} color="#EF4444" />
                      <Text
                        style={{
                          marginLeft: 8,
                          color: "#EF4444",
                          fontWeight: "600",
                        }}
                      >
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

          {/* Renter Review Section */}
          {canReview && (
            <View className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Đánh giá chuyến đi
              </Text>
              <Text className="text-sm text-gray-600 mb-3">
                Chia sẻ trải nghiệm của bạn về chuyến đi này
              </Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#10B981",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="rate-review" size={20} color="#10B981" />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: "#10B981",
                      fontWeight: "600",
                    }}
                  >
                    Viết đánh giá
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

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
              placeholderTextColor="#9CA3AF"
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

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Đánh giá chuyến đi
            </Text>

            <Text className="text-sm text-gray-600 mb-4">
              Bạn đánh giá chuyến đi này như thế nào?
            </Text>

            {/* Star Rating */}
            <View className="items-center mb-4">
              {renderStars(reviewRating, true, setReviewRating)}
            </View>

            {/* Review Content */}
            <Text className="text-sm text-gray-600 mb-2">
              Nhận xét (tùy chọn)
            </Text>
            <TextInput
              value={reviewContent}
              onChangeText={setReviewContent}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-base min-h-[100px]"
              textAlignVertical="top"
            />

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewContent("");
                }}
                disabled={createReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-lg border border-gray-300 bg-white"
              >
                <Text className="text-center font-medium text-gray-700">
                  Hủy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={createReviewMutation.isPending || reviewRating === 0}
                className="flex-1 py-3 px-4 rounded-lg bg-green-600"
                style={{
                  opacity:
                    createReviewMutation.isPending || reviewRating === 0
                      ? 0.5
                      : 1,
                }}
              >
                {createReviewMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center font-medium text-white">
                    Gửi đánh giá
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
