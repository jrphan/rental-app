import { COLORS } from "@/constants/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

interface ProfileActionsProps {
  user: {
    phone?: string;
    isPhoneVerified?: boolean;
    role?: string;
  } | null;
  myKyc?: { status?: string; reviewNotes?: string | null } | null;
  isLoadingKyc: boolean;
}

export default function ProfileActions({
  user,
  myKyc,
  isLoadingKyc,
}: ProfileActionsProps) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-4">Cài đặt</Text>

      {/* Owner Application Section - Show for RENTER or if no application yet */}
      {/* {(user?.role === "RENTER" || !myOwnerApplication) && (
        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <MaterialIcons
                name="directions-car"
                size={24}
                color={COLORS.primary}
              />
              <Text className="ml-3 text-base font-medium text-gray-900">
                Đăng ký làm chủ xe
              </Text>
            </View>
          </View>
          {isLoadingOwnerApp ? (
            <View className="py-2">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : myOwnerApplication ? (
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full mr-2 ${
                      myOwnerApplication.status === "PENDING"
                        ? "bg-yellow-500"
                        : myOwnerApplication.status === "APPROVED"
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  />
                  <Text className="text-sm font-semibold text-gray-900">
                    {myOwnerApplication.status === "PENDING"
                      ? "Đang chờ duyệt"
                      : myOwnerApplication.status === "APPROVED"
                        ? "Đã được duyệt"
                        : "Bị từ chối"}
                  </Text>
                </View>
                {myOwnerApplication.status === "REJECTED" && (
                  <Button
                    size="sm"
                    onPress={() =>
                      submitOwnerApplicationMutation.mutate(undefined)
                    }
                    disabled={submitOwnerApplicationMutation.isPending}
                  >
                    <Text className="text-white font-semibold text-xs">
                      Gửi lại
                    </Text>
                  </Button>
                )}
              </View>
              {myOwnerApplication.status === "PENDING" && (
                <Text className="text-xs text-gray-600 mt-2">
                  Yêu cầu của bạn đang được xem xét. Bạn sẽ được thông
                  báo khi có kết quả.
                </Text>
              )}
              {myOwnerApplication.status === "APPROVED" && (
                <Text className="text-xs text-green-600 mt-2">
                  Chúc mừng! Bạn đã trở thành chủ xe. Bây giờ bạn có thể
                  đăng xe cho thuê.
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text className="text-sm text-gray-600 mb-3">
                Để trở thành chủ xe, bạn cần:
              </Text>
              <View className="mb-3">
                <View className="flex-row items-start mb-2">
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text className="text-xs text-gray-700 flex-1">
                    Tạo ít nhất 1 chiếc xe
                  </Text>
                </View>
                <View className="flex-row items-start mb-2">
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text className="text-xs text-gray-700 flex-1">
                    Gửi xe để admin duyệt
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#22c55e"
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text className="text-xs text-gray-700 flex-1">
                    Khi có xe đầu tiên được duyệt, yêu cầu làm chủ xe sẽ
                    tự động được gửi
                  </Text>
                </View>
              </View>
              <Button
                onPress={() => router.push("/(tabs)/profile/vehicle-create")}
                className="mb-2"
              >
                <Text className="text-white font-semibold">Tạo xe mới</Text>
              </Button>
            </View>
          )}
        </View>
      )} */}

      {user?.phone && !user?.isPhoneVerified && (
        <TouchableOpacity className="bg-yellow-50 border-yellow-200 rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border-2">
          <View className="flex-row items-center flex-1">
            <MaterialIcons name="phone" size={24} color="#F59E0B" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-900">
                Xác minh số điện thoại
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Cần xác minh để sử dụng đầy đủ tính năng
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200">
        <View className="flex-row items-center">
          <MaterialIcons name="edit" size={24} color={COLORS.primary} />
          <Text className="ml-3 text-base font-medium text-gray-900">
            Chỉnh sửa hồ sơ
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Xem danh sách xe của tôi */}
      <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200">
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="motorbike"
            size={24}
            color={COLORS.primary}
          />
          <Text className="ml-3 text-base font-medium text-gray-900">
            Xe của tôi
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Allow any user to create vehicle, not just OWNER */}
      {/* <TouchableOpacity
        onPress={() => router.push("/(tabs)/profile/vehicle-create")}
        className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200"
      >
        <View className="flex-row items-center">
          <MaterialIcons
            name="add-circle"
            size={24}
            color={COLORS.primary}
          />
          <Text className="ml-3 text-base font-medium text-gray-900">
            Đăng xe mới
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity> */}

      <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 flex-row items-center justify-between shadow-sm border border-gray-200">
        <View className="flex-row items-center">
          <MaterialIcons name="lock" size={24} color={COLORS.primary} />
          <Text className="ml-3 text-base font-medium text-gray-900">
            Đổi mật khẩu
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <TouchableOpacity className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialIcons
              name="verified-user"
              size={24}
              color={COLORS.primary}
            />
            <Text className="ml-3 text-base font-medium text-gray-900">
              Xác thực danh tính (KYC)
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        {isLoadingKyc ? (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : myKyc ? (
          <View className="mt-3 pt-3 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full mr-2 ${
                    myKyc.status === "APPROVED"
                      ? "bg-green-500"
                      : myKyc.status === "REJECTED"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                />
                <Text className="text-sm font-semibold text-gray-900">
                  {myKyc.status === "APPROVED"
                    ? "Đã được duyệt"
                    : myKyc.status === "REJECTED"
                    ? "Bị từ chối"
                    : "Đang chờ duyệt"}
                </Text>
              </View>
            </View>
            {myKyc.reviewNotes && (
              <Text className="text-xs text-gray-600 mt-2" numberOfLines={2}>
                {myKyc.reviewNotes}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}
