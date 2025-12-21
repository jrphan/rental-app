import React from "react";
import { View, Text, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HeaderBase from "@/components/header/HeaderBase";
import { apiVehicle } from "@/services/api.vehicle";
import { COLORS } from "@/constants/colors";
import VehicleCard from "./components/VehicleCard";

export default function OwnerVehiclesScreen() {
  const { ownerId, ownerName, ownerAvatar } = useLocalSearchParams<{
    ownerId: string;
    ownerName?: string;
    ownerAvatar?: string;
  }>();
  const router = useRouter();

  // Fetch vehicles by owner
  const {
    data: vehiclesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["vehiclesByOwner", ownerId],
    queryFn: () => {
      if (!ownerId) throw new Error("Owner ID is required");
      return apiVehicle.getVehiclesByOwner(ownerId);
    },
    enabled: !!ownerId,
  });

  const vehicles = vehiclesData?.items || [];

  // Get owner info from first vehicle (all vehicles have same owner)
  const ownerInfo = vehicles.length > 0 ? vehicles[0].owner : null;
  const displayName = ownerName || ownerInfo?.fullName || "Chủ xe";
  const ownerEmail = ownerInfo?.email;
  const ownerPhone = ownerInfo?.phone;
  const ownerAvatarFromApi = ownerInfo?.avatar;

  // Use avatar from params first, fallback to API response
  const finalOwnerAvatar = ownerAvatar || ownerAvatarFromApi;

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title="Xe cho thuê" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải danh sách xe...</Text>
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
        <HeaderBase title="Xe cho thuê" showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-red-600 text-center">
            Không thể tải danh sách xe. Vui lòng thử lại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header with transparent background */}
        <View className="absolute top-0 left-0 right-0 z-10">
          <HeaderBase title="" showBackButton />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover Image / Banner */}
          <View
            className="w-full h-48 relative"
            style={{ backgroundColor: COLORS.primary }}
          >
            <View
              className="absolute inset-0"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.1)",
              }}
            />
            {/* Pattern overlay */}
            <View className="absolute inset-0 opacity-20">
              <View className="flex-row h-full">
                {Array.from({ length: 8 }).map((_, i) => (
                  <View key={i} className="flex-1 border-r border-white/30" />
                ))}
              </View>
            </View>
          </View>

          {/* Profile Section */}
          <View className="px-4 -mt-20 mb-4">
            {/* Avatar */}
            <View className="items-center mb-4">
              <View
                className="rounded-full p-1 bg-white"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                {finalOwnerAvatar ? (
                  <Image
                    source={{ uri: finalOwnerAvatar }}
                    className="w-32 h-32 rounded-full"
                    style={{ borderWidth: 4, borderColor: "#FFFFFF" }}
                  />
                ) : (
                  <View
                    className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center"
                    style={{ borderWidth: 4, borderColor: "#FFFFFF" }}
                  >
                    <MaterialIcons
                      name="account-circle"
                      size={96}
                      color="#9CA3AF"
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Owner Name & Info */}
            <View className="items-center mb-6">
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl font-bold text-gray-900">
                  {displayName}
                </Text>
              </View>

              {/* Contact Info */}
              {(ownerEmail || ownerPhone) && (
                <View className="mt-3 w-full px-4">
                  {ownerPhone && (
                    <View className="flex-row items-center justify-center mb-2">
                      <MaterialIcons name="phone" size={18} color="#6B7280" />
                      <Text className="ml-2 text-base text-gray-700">
                        {ownerPhone}
                      </Text>
                    </View>
                  )}
                  {ownerEmail && (
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons name="email" size={18} color="#6B7280" />
                      <Text className="ml-2 text-base text-gray-700">
                        {ownerEmail}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Stats */}
              <View className="flex-row items-center justify-center gap-6 mt-4">
                <View className="items-center">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="directions-bike"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text className="text-2xl font-bold text-gray-900 ml-2">
                      {vehicles.length}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">
                    Xe cho thuê
                  </Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-gray-200 mb-6" />
          </View>

          {/* Vehicles List */}
          {vehicles.length === 0 ? (
            <View className="items-center justify-center py-20 px-4">
              <View
                className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <MaterialIcons
                  name="directions-bike"
                  size={48}
                  color="#D1D5DB"
                />
              </View>
              <Text className="text-gray-500 text-center text-base font-medium">
                Chủ xe này chưa có xe nào sẵn sàng cho thuê
              </Text>
            </View>
          ) : (
            <View className="px-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  Xe cho thuê
                </Text>
                <View
                  className="bg-primary-100 px-3 py-1 rounded-full"
                  style={{ backgroundColor: COLORS.primary + "15" }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: COLORS.primary }}
                  >
                    {vehicles.length} {vehicles.length === 1 ? "xe" : "xe"}
                  </Text>
                </View>
              </View>

              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onPress={() => router.push(`/vehicle/${vehicle.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
