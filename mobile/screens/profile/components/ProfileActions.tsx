import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Kyc, User } from "@/types/auth.types";

interface ProfileActionsProps {
  user: User | null;
  myKyc?: Kyc | null;
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
  myKyc,
  isLoadingKyc,
}: ProfileActionsProps) {
  const router = useRouter();

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
      title: "Đăng ký làm chủ xe",
      route: "/(tabs)/profile/register-vendor",
    },
    {
      id: "my-vehicles",
      icon: "motorbike",
      iconType: "MaterialCommunityIcons",
      title: "Xe của tôi",
      route: "/(tabs)/profile/my-vehicles",
      showCondition: () => user?.isVendor ?? false,
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
    const iconProps = {
      size: 22,
      color: COLORS.primary,
    };

    if (item.iconType === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={item.icon as any} {...iconProps} />;
    }
    return <MaterialIcons name={item.icon as any} {...iconProps} />;
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
      {actionItems.map((item) => {
        if (item.showCondition && !item.showCondition()) {
          return null;
        }

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handlePress(item)}
            className="bg-white rounded-2xl p-2 mb-3 flex-row items-center justify-between shadow-lg border border-gray-200"
            style={{
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <View className="flex-row items-center flex-1">
              <View className="bg-orange-100 rounded-xl p-3">
                {renderIcon(item)}
              </View>
              <Text className="ml-4 text-base font-medium text-gray-900">
                {item.title}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        );
      })}

      {/* KYC Section */}
      <View
        className="bg-white rounded-2xl p-2 mb-3 shadow-lg border border-gray-200"
        style={{
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/profile/kyc" as any)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1">
            <View className="bg-orange-100 rounded-xl p-3">
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
        {isLoadingKyc ? (
          <View className="mt-4 pt-4 border-t border-gray-200">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : myKyc ? (
          <View className="mt-4 pt-4 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-3.5 h-3.5 rounded-full mr-3 ${
                    myKyc.status === "APPROVED"
                      ? "bg-green-500"
                      : myKyc.status === "REJECTED"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
                <Text className="text-sm font-medium text-gray-900">
                  {myKyc.status === "APPROVED"
                    ? "Đã được duyệt"
                    : myKyc.status === "REJECTED"
                    ? "Bị từ chối"
                    : "Đang chờ duyệt"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
