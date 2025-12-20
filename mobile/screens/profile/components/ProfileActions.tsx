import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { User } from "@/types/auth.types";
import {
  KYC_STATUS,
  getKycStatusLabel,
  getKycStatusColor,
  getKycStatusBgColor,
  getKycStatusBorderColor,
  getKycStatusIconColor,
  getKycStatusIcon,
} from "@/constants/kyc.constants";
import { useQuery } from "@tanstack/react-query";
import { apiVehicle } from "@/services/api.vehicle";

interface ProfileActionsProps {
  user: User | null;
  isLoadingKyc: boolean;
}

interface ActionItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap | "motorbike";
  iconType: "MaterialIcons" | "MaterialCommunityIcons";
  title: string;
  route?: string;
  onPress?: () => void;
  showCondition?: () => boolean;
}

export default function ProfileActions({
  user,
  isLoadingKyc,
}: ProfileActionsProps) {
  const router = useRouter();

  // Fetch pending vehicles if user is eligible but not yet a vendor
  const { data: pendingVehicles, isLoading: isLoadingPendingVehicles } =
    useQuery({
      queryKey: ["myVehicles", "PENDING"],
      queryFn: () => apiVehicle.getMyVehicles("PENDING"),
      enabled:
        !!user &&
        !user.isVendor &&
        user.isActive &&
        user.isPhoneVerified &&
        user.kyc?.status === "APPROVED",
    });

  const pendingVehicle = pendingVehicles?.items?.[0]; // Get first pending vehicle

  const actionItems: ActionItem[] = [
    {
      id: "edit-profile",
      icon: "edit",
      iconType: "MaterialIcons",
      title: "Chỉnh sửa hồ sơ",
      route: "/(tabs)/profile/edit-profile",
    },
    {
      id: "register-vendor",
      icon: "app-registration",
      iconType: "MaterialIcons",
      title: pendingVehicle
        ? "Xem đăng ký xe đang chờ duyệt"
        : "Đăng ký làm chủ xe",
      route: pendingVehicle
        ? `/(tabs)/profile/register-vendor?vehicleId=${pendingVehicle.id}`
        : "/(tabs)/profile/register-vendor",
      showCondition: () => !user?.isVendor,
    },
    {
      id: "my-vehicles",
      icon: "motorbike",
      iconType: "MaterialCommunityIcons",
      title: "Xe của tôi",
      route: "/(tabs)/vehicles",
      showCondition: () => user?.isVendor ?? false,
    },
    {
      id: "favorites",
      icon: "favorite",
      iconType: "MaterialIcons",
      title: "Xe yêu thích",
      route: "/(tabs)/profile/favorites",
    },
    {
      id: "change-password",
      icon: "lock",
      iconType: "MaterialIcons",
      title: "Đổi mật khẩu",
      route: "/(tabs)/profile/change-password",
    },
  ];

  const handlePress = (item: ActionItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const renderIcon = (item: ActionItem) => {
    const iconProps = { size: 22, color: COLORS.primary };
    const IconComponent =
      item.iconType === "MaterialCommunityIcons"
        ? MaterialCommunityIcons
        : MaterialIcons;
    return <IconComponent name={item.icon as any} {...iconProps} />;
  };

  const renderKycStatus = () => {
    if (isLoadingKyc) {
      return (
        <View className="mt-4 pt-4 border-t border-gray-200">
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    if (!user?.kyc) return null;

    const { status, rejectionReason } = user.kyc;
    const bgColor = getKycStatusBgColor(status);
    const borderColor = getKycStatusBorderColor(status);
    const iconColor = getKycStatusIconColor(status);
    const iconName = getKycStatusIcon(status);
    const showRejection =
      (status === KYC_STATUS.REJECTED || status === KYC_STATUS.NEEDS_UPDATE) &&
      rejectionReason;

    return (
      <View className="pt-4 border-t border-gray-200">
        <View
          className={`${bgColor} ${borderColor} rounded-xl p-3 border w-fit`}
        >
          <View className="flex-row items-center">
            <View
              className="rounded-full py-1 px-2 mr-2"
              style={{ backgroundColor: `${iconColor}20` }}
            >
              <MaterialIcons
                name={iconName as any}
                size={16}
                color={iconColor}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <View
                  className={`w-2 h-2 rounded-full ${getKycStatusColor(
                    status
                  )}`}
                />
                <Text className="text-base font-semibold text-gray-900">
                  {getKycStatusLabel(status)}
                </Text>
              </View>
              {showRejection && (
                <View className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                  <Text className="text-xs font-medium text-gray-700 mb-1">
                    Lý do:
                  </Text>
                  <Text className="text-xs text-gray-600 leading-4">
                    {rejectionReason}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="mb-4">
      <Text className="text-xl font-medium text-gray-900 mb-5 px-1">
        Cài đặt
      </Text>
      {user?.phone && !user?.isPhoneVerified && (
        <TouchableOpacity
          activeOpacity={0.7}
          className="bg-amber-50 border-amber-300 rounded-2xl p-5 mb-4 flex-row items-center justify-between shadow-lg border-2"
          style={{
            elevation: 4,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <View className="flex-row items-center flex-1">
            <View className="bg-amber-200 rounded-full p-3">
              <MaterialIcons name="phone" size={24} color="#F59E0B" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium text-gray-900">
                Xác minh số điện thoại
              </Text>
              <Text className="text-sm text-amber-800 mt-1">
                Cần xác minh để sử dụng đầy đủ tính năng
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* Action Items */}
      {actionItems
        .filter((item) => !item.showCondition || item.showCondition())
        .map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
            className="bg-white rounded-2xl p-2 mb-3 flex-row items-center justify-between border border-gray-200"
          >
            <View className="flex-row items-center flex-1">
              <View className="rounded-xl p-3">{renderIcon(item)}</View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-medium text-gray-900">
                  {item.title}
                </Text>
                {item.id === "register-vendor" && pendingVehicle && (
                  <View className="mt-1 flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    <Text className="text-xs text-amber-700">
                      Đang chờ duyệt
                    </Text>
                  </View>
                )}
                {item.id === "register-vendor" && isLoadingPendingVehicles && (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                    style={{ marginTop: 4 }}
                  />
                )}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

      {/* KYC Section */}
      <View className="bg-white rounded-2xl p-2 mb-3 border border-gray-200">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/profile/kyc" as any)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <View className="rounded-xl p-3">
              <MaterialIcons
                name="verified-user"
                size={22}
                color={COLORS.primary}
              />
            </View>
            <Text className="ml-4 text-base font-medium text-gray-900">
              Xác thực danh tính (KYC)
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        {renderKycStatus()}
      </View>
    </View>
  );
}
