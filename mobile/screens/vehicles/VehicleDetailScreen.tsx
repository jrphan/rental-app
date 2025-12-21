import React from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import { apiVehicle } from "@/services/api.vehicle";
import { apiReview, type Review } from "@/services/api.review";
import { apiUser } from "@/services/api.user";
import { formatPrice, getVehicleStatusLabel } from "./utils";
import type { Vehicle } from "./types";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/auth";
import VehicleImageCarousel from "./components/VehicleImageCarousel";
import { useToast } from "@/hooks/useToast";

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToast();

  // Try to get vehicle detail - first try as owner, then as public
  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery<Vehicle>({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      if (!id) throw new Error("Vehicle ID is required");
      // Nếu có user, thử lấy với getMyVehicleDetail trước (nếu là chủ xe)
      if (user?.id && isAuthenticated) {
        try {
          const vehicleData = await apiVehicle.getMyVehicleDetail(id);
          // Kiểm tra xem có phải chủ xe không
          if (vehicleData.ownerId === user.id) {
            return vehicleData;
          }
          // Nếu không phải chủ xe, dùng public API
          return apiVehicle.getVehicleDetail(id);
        } catch {
          // Nếu lỗi (không phải chủ xe hoặc không có quyền), dùng public API
          return apiVehicle.getVehicleDetail(id);
        }
      }
      // Nếu không có user hoặc chưa đăng nhập, dùng public API
      return apiVehicle.getVehicleDetail(id);
    },
    enabled: !!id,
  });

  const isOwner = user?.id && vehicle?.ownerId === user.id;
  const queryClient = useQueryClient();

  // Check favorite status (only for non-owners)
  const { data: favoriteData } = useQuery({
    queryKey: ["favorite", id],
    queryFn: () => {
      if (!id) throw new Error("Vehicle ID is required");
      return apiUser.checkFavorite(id);
    },
    enabled: !!id && !!user && !isOwner,
  });

  const isFavorite = favoriteData?.isFavorite ?? false;

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Vehicle ID is required");
      if (isFavorite) {
        return apiUser.removeFavorite(id);
      } else {
        return apiUser.addFavorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleToggleFavorite = () => {
    favoriteMutation.mutate();
  };

  // Fetch reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["vehicleReviews", id],
    queryFn: () => {
      if (!id) throw new Error("Vehicle ID is required");
      return apiReview.getVehicleReviews(id);
    },
    enabled: !!id && !!vehicle,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? "star" : "star-border"}
            size={16}
            color={star <= rating ? "#F59E0B" : "#D1D5DB"}
          />
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
        <HeaderBase title="Chi tiết xe" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải thông tin xe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !vehicle) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Chi tiết xe" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-red-600 text-center">
            Không thể tải thông tin xe. Vui lòng thử lại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Favorite button (only show for non-owners)
  const favoriteButton =
    !isOwner && user ? (
      <TouchableOpacity
        onPress={handleToggleFavorite}
        disabled={favoriteMutation.isPending}
        className="p-2"
      >
        <MaterialIcons
          name={isFavorite ? "favorite" : "favorite-border"}
          size={24}
          color={isFavorite ? "#EF4444" : "#6B7280"}
        />
      </TouchableOpacity>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Chi tiết xe" showBackButton action={favoriteButton} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Image Carousel */}
        <VehicleImageCarousel images={vehicle.images || []} height={320} />

        {/* Content */}
        <View className="px-4 pt-4">
          {/* Header */}
          <View className="mt-4 mb-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text className="text-base text-gray-600 mt-1">
                  Năm {vehicle.year} • {vehicle.color}
                </Text>
              </View>
              {isOwner && (
                <View
                  className={`px-3 py-1 rounded-full ${
                    vehicle.status === "APPROVED"
                      ? "bg-green-100"
                      : vehicle.status === "PENDING"
                        ? "bg-yellow-100"
                        : vehicle.status === "REJECTED"
                          ? "bg-red-100"
                          : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      vehicle.status === "APPROVED"
                        ? "text-green-700"
                        : vehicle.status === "PENDING"
                          ? "text-yellow-700"
                          : vehicle.status === "REJECTED"
                            ? "text-red-700"
                            : "text-gray-700"
                    }`}
                  >
                    {getVehicleStatusLabel(vehicle.status)}
                  </Text>
                </View>
              )}
            </View>

            {/* License Plate */}
            <View className="flex-row items-center mt-2">
              <MaterialIcons
                name="confirmation-number"
                size={20}
                color="#6B7280"
              />
              <Text className="ml-2 text-base font-mono text-gray-700">
                {vehicle.licensePlate}
              </Text>
            </View>
          </View>

          {/* Price Section */}
          <View
            className="bg-orange-50 rounded-xl p-4 mb-4"
            style={{
              borderWidth: 1,
              borderColor: `${COLORS.primary}30`,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600 mb-1">
                  Giá thuê/ngày
                </Text>
                <Text className="text-2xl font-bold text-orange-600">
                  {formatPrice(Number(vehicle.pricePerDay))}
                </Text>
              </View>
              {vehicle.depositAmount > 0 && (
                <View className="items-end">
                  <Text className="text-sm text-gray-600 mb-1">Tiền cọc</Text>
                  <Text className="text-lg font-semibold text-gray-700">
                    {formatPrice(Number(vehicle.depositAmount))}
                  </Text>
                </View>
              )}
            </View>
            {vehicle.instantBook && (
              <View className="mt-3 flex-row items-center">
                <MaterialIcons name="flash-on" size={16} color="#F59E0B" />
                <Text className="ml-2 text-sm text-orange-700 font-medium">
                  Đặt xe ngay (Instant Book)
                </Text>
              </View>
            )}
          </View>

          {/* Vehicle Details */}
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Thông tin xe
            </Text>
            <View>
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="settings" size={20} color="#6B7280" />
                <Text className="ml-3 text-base text-gray-700">
                  Dung tích: {vehicle.engineSize} cc
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <MaterialIcons
                  name="directions-bike"
                  size={20}
                  color="#6B7280"
                />
                <Text className="ml-3 text-base text-gray-700">
                  Bằng lái yêu cầu: {vehicle.requiredLicense}
                </Text>
              </View>
              <View className="flex-row items-center">
                <MaterialIcons name="location-on" size={20} color="#6B7280" />
                <Text className="ml-3 text-base text-gray-700 flex-1">
                  {vehicle.address}
                  {vehicle.district && `, ${vehicle.district}`}
                  {vehicle.city && `, ${vehicle.city}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Owner Information */}
          {vehicle.owner && !isOwner && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Chủ xe
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!vehicle.owner) return;
                  const params = new URLSearchParams({
                    ownerName: vehicle.owner.fullName || "Chủ xe",
                  });
                  if (vehicle.owner.avatar) {
                    params.append("ownerAvatar", vehicle.owner.avatar);
                  }
                  router.push(`/owner/${vehicle.ownerId}?${params.toString()}`);
                }}
                activeOpacity={0.7}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <View className="flex-row items-center">
                  {vehicle.owner?.avatar ? (
                    <Image
                      source={{ uri: vehicle.owner.avatar }}
                      className="w-16 h-16 rounded-full mr-3"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-full mr-3 bg-gray-300 items-center justify-center">
                      <MaterialIcons
                        name="account-circle"
                        size={40}
                        color="#9CA3AF"
                      />
                    </View>
                  )}
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold text-gray-900">
                        {vehicle.owner?.fullName || "Chủ xe"}
                      </Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#6B7280"
                      />
                    </View>
                    <View className="flex-row items-center mt-1">
                      <MaterialIcons name="phone" size={16} color="#6B7280" />
                      <Text className="ml-1 text-sm text-gray-600">
                        {vehicle.owner?.phone || ""}
                      </Text>
                    </View>
                    {vehicle.owner?.email && (
                      <View className="flex-row items-center mt-1">
                        <MaterialIcons name="email" size={16} color="#6B7280" />
                        <Text className="ml-1 text-sm text-gray-600">
                          {vehicle.owner.email}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center mt-2">
                      <Text className="text-sm text-primary-600 font-medium">
                        Xem tất cả xe cho thuê
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          {vehicle.description && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả
              </Text>
              <Text className="text-base text-gray-700 leading-6">
                {vehicle.description}
              </Text>
            </View>
          )}

          {/* Reviews Section */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">
                Đánh giá ({reviewsData?.totalReviews || 0})
              </Text>
              {reviewsData && reviewsData.averageRating > 0 && (
                <View className="flex-row items-center">
                  <MaterialIcons name="star" size={20} color="#F59E0B" />
                  <Text className="ml-1 text-base font-semibold text-gray-900">
                    {reviewsData.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {isLoadingReviews ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : reviewsData && reviewsData.reviews.length > 0 ? (
              <View className="space-y-3">
                {reviewsData.reviews.map((review: Review) => (
                  <View
                    key={review.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {review.author.fullName || "Người dùng"}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          {renderStars(review.rating)}
                          <Text className="ml-2 text-xs text-gray-500">
                            {formatDate(review.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {review.content && (
                      <Text className="text-sm text-gray-700 mt-2 leading-5">
                        {review.content}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-gray-50 rounded-xl p-6 items-center">
                <MaterialIcons name="rate-review" size={48} color="#9CA3AF" />
                <Text className="mt-2 text-sm text-gray-500 text-center">
                  Chưa có đánh giá nào cho xe này
                </Text>
              </View>
            )}
          </View>

          {/* Owner Actions (only for owner) */}
          {isOwner && vehicle.status === "REJECTED" && (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(tabs)/profile/register-vendor?vehicleId=${vehicle.id}`
                )
              }
              className="bg-primary-600 rounded-xl p-4 mb-4"
            >
              <View className="flex-row items-center justify-center">
                <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-base font-semibold text-white">
                  Cập nhật và gửi lại
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Rent Button (only for non-owners and approved vehicles) */}
          {!isOwner && vehicle.status === "APPROVED" && (
            <TouchableOpacity
              onPress={() => {
                if (!isAuthenticated || !user) {
                  toast.showInfo("Vui lòng đăng nhập để sử dụng chức năng này");
                } else {
                  router.push(`/booking?vehicleId=${vehicle.id}`);
                }
              }}
              className="bg-orange-600 rounded-xl p-4 mb-4"
              style={{ backgroundColor: COLORS.primary }}
            >
              <View className="flex-row items-center justify-center">
                <MaterialIcons
                  name="directions-bike"
                  size={24}
                  color="#FFFFFF"
                />
                <Text className="ml-2 text-lg font-semibold text-white">
                  {isAuthenticated && user ? "Thuê xe" : "Đăng nhập để thuê xe"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
