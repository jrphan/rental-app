import { View, Text } from "react-native";

interface ProfileAddressProps {
  profile?: { address?: string | null } | null;
}

export default function ProfileAddress({ profile }: ProfileAddressProps) {
  if (!profile?.address) return null;
  return (
    <View className="mb-4">
      <Text className="text-xl font-bold text-gray-900 mb-4 px-1">
        Địa chỉ
      </Text>
      <View
        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200"
        style={{
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Text className="text-base text-gray-700 leading-6">
          {profile.address}
        </Text>
      </View>
    </View>
  );
}
