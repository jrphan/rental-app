import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderBase from "@/components/header/HeaderBase";
import KycForm from "./components/KycForm";
import { useAuthStore } from "@/store/auth";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { KYC_STATUS, getKycStatusLabel } from "@/constants/kyc.constants";

export default function KycScreen() {
  const { user } = useAuthStore();
  const kyc = user?.kyc;

  const getStatusConfig = () => {
    if (!kyc) return null;

    switch (kyc.status) {
      case KYC_STATUS.APPROVED:
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: "check-circle" as const,
          iconColor: "#10B981",
          title: getKycStatusLabel(KYC_STATUS.APPROVED),
          message: "Hồ sơ KYC của bạn đã được duyệt thành công.",
        };
      case KYC_STATUS.PENDING:
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          icon: "pending" as const,
          iconColor: "#F59E0B",
          title: getKycStatusLabel(KYC_STATUS.PENDING),
          message:
            "Hồ sơ KYC của bạn đang được xem xét. Vui lòng chờ phản hồi.",
        };
      case KYC_STATUS.REJECTED:
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: "cancel" as const,
          iconColor: "#EF4444",
          title: getKycStatusLabel(KYC_STATUS.REJECTED),
          message:
            "Hồ sơ KYC của bạn đã bị từ chối. Vui lòng cập nhật thông tin.",
        };
      case KYC_STATUS.NEEDS_UPDATE:
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          icon: "update" as const,
          iconColor: "#F97316",
          title: getKycStatusLabel(KYC_STATUS.NEEDS_UPDATE),
          message:
            "Hồ sơ KYC của bạn cần được cập nhật. Vui lòng chỉnh sửa thông tin.",
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
      <HeaderBase title="Xác thực danh tính (KYC)" showBackButton />
      <View className="flex-1 px-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {statusConfig && (
            <View
              className={`${statusConfig.bgColor} ${statusConfig.borderColor} rounded-2xl p-4 mb-4 border-2`}
            >
              <View className="flex-row items-start">
                <View
                  className="rounded-full p-2"
                  style={{ backgroundColor: `${statusConfig.iconColor}20` }}
                >
                  <MaterialIcons
                    name={statusConfig.icon}
                    size={24}
                    color={statusConfig.iconColor}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-gray-900">
                    {statusConfig.title}
                  </Text>
                  <Text className="text-sm text-gray-700 mt-1">
                    {statusConfig.message}
                  </Text>
                  {kyc &&
                    (kyc.status === KYC_STATUS.REJECTED ||
                      kyc.status === KYC_STATUS.NEEDS_UPDATE) &&
                    kyc.rejectionReason && (
                      <View className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
                        <Text className="text-xs font-medium text-gray-600 mb-1">
                          Lý do:
                        </Text>
                        <Text className="text-sm text-gray-900">
                          {kyc.rejectionReason}
                        </Text>
                      </View>
                    )}
                </View>
              </View>
            </View>
          )}

          <KycForm />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
