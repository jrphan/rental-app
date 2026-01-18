import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";
import HeaderBase from "@/components/header/HeaderBase";
import { apiVehicle } from "@/services/api.vehicle";
import { apiChat } from "@/services/api.chat";
import { useAuthStore } from "@/store/auth";
import { COLORS } from "@/constants/colors";
import { useToast } from "@/hooks/useToast";
import VehicleCard from "./components/VehicleCard";

export default function OwnerVehiclesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const toast = useToast();
  const [avatarError, setAvatarError] = useState(false);
  const { ownerId, ownerName, ownerAvatar, ownerEmail, ownerPhone } = useLocalSearchParams<{
    ownerId: string;
    ownerName?: string;
    ownerAvatar?: string;
    ownerEmail?: string;
    ownerPhone?: string;
  }>();

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

  // Fetch user's chats to find chat with this owner
  const { data: myChats } = useQuery({
    queryKey: ["chats"],
    queryFn: () => apiChat.getMyChats(),
    enabled: !!user && !!ownerId,
  });

  // Find chat with this owner
  const chatWithOwner = myChats?.find(
    (chat) => chat.otherUser.id === ownerId
  );

  const vehicles = vehiclesData?.items || [];

  // Get owner info from first vehicle (all vehicles have same owner)
  // Use params first, fallback to API response
  const ownerInfo = vehicles.length > 0 ? vehicles[0].owner : null;
  const displayName = ownerName || ownerInfo?.fullName || "Người dùng";
  const finalOwnerEmail = ownerEmail || ownerInfo?.email;
  const finalOwnerPhone = ownerPhone || ownerInfo?.phone;
  const ownerAvatarFromApi = ownerInfo?.avatar;

  // Use avatar from params first, fallback to API response
  const finalOwnerAvatar = ownerAvatar || ownerAvatarFromApi;
  const shouldShowAvatar = finalOwnerAvatar && !avatarError;

  // Display name for loading/error states (use params only)
  const loadingDisplayName = ownerName || "Hồ sơ";

  useEffect(() => {
    setAvatarError(false);
  }, [finalOwnerAvatar]);

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.showSuccess(`${label} đã được sao chép`);
    } catch (error) {
      toast.showError("Không thể sao chép");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <HeaderBase title={loadingDisplayName} showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-4 text-gray-600">Đang tải thông tin...</Text>
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
        <HeaderBase title={loadingDisplayName} showBackButton />
        <View className="flex-1 items-center justify-center px-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-red-600 text-center">
            Không thể tải thông tin. Vui lòng thử lại.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title={displayName} showBackButton />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View className="px-4 pt-4">
          {/* Avatar */}
          <View className="items-center mt-4 mb-4">
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
              {shouldShowAvatar ? (
                <Image
                  source={{ uri: finalOwnerAvatar }}
                  className="w-32 h-32 rounded-full"
                  style={{
                    borderWidth: 4,
                    borderColor: "#FFFFFF",
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                  }}
                  onError={() => setAvatarError(true)}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="rounded-full bg-primary-100 items-center justify-center"
                  style={{
                    borderWidth: 4,
                    borderColor: "#FFFFFF",
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                  }}
                >
                  <MaterialIcons
                    name="person"
                    size={64}
                    color={COLORS.primary}
                  />
                </View>
              )}
            </View>
          </View>

          {/* User Name & Info */}
          <View className="items-center mb-6">
            {/* Contact Info */}
            {(finalOwnerEmail || finalOwnerPhone) && (
              <View className="mt-2 w-full">
                {finalOwnerPhone && (
                  <View className="flex-row items-center justify-center mb-2">
                    <MaterialIcons name="phone" size={18} color="#6B7280" />
                    <Text className="ml-2 text-base text-gray-700">
                      {finalOwnerPhone}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopyToClipboard(finalOwnerPhone, "Số điện thoại")}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="content-copy" size={16} color="#6B7280" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                )}
                {finalOwnerEmail && (
                  <View className="flex-row items-center justify-center">
                    <MaterialIcons name="email" size={18} color="#6B7280" />
                    <Text className="ml-2 text-base text-gray-700">
                      {finalOwnerEmail}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopyToClipboard(finalOwnerEmail, "Email")}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="content-copy" size={16} color="#6B7280" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Stats */}
            {vehicles.length > 0 && (
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
                  <Text className="text-sm text-gray-600 mt-1">Xe cho thuê</Text>
                </View>
              </View>
            )}

            {/* Message Button - Only show if user is logged in, not viewing own profile, and chat exists */}
            {user && user.id !== ownerId && chatWithOwner && (
              <TouchableOpacity
                onPress={() => router.push(`/messages/chat/${chatWithOwner.id}`)}
                className="mt-4 flex-row items-center justify-center px-6 py-3 rounded-xl"
                style={{ backgroundColor: COLORS.primary }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="message" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base ml-2">
                  Nhắn tin
                </Text>
              </TouchableOpacity>
            )}
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
              <MaterialIcons name="directions-bike" size={48} color="#D1D5DB" />
            </View>
            <Text className="text-gray-500 text-center text-base font-medium">
              {displayName} chưa có xe nào sẵn sàng cho thuê
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
                  {vehicles.length} xe
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
  );
}
