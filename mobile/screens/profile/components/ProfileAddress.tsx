import { View, Text } from "react-native";

interface ProfileAddressProps {
  profile?: { address?: string | null } | null;
}

export default function ProfileAddress({ profile }: ProfileAddressProps) {
  if (!profile?.address) return null;
  return (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-2">Địa chỉ</Text>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-base text-gray-700">{profile.address}</Text>
      </View>
    </View>
  );
}
