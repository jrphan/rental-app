import { View, Text } from "react-native";

interface ProfileBioProps {
  profile?: { bio?: string | null } | null;
}

export default function ProfileBio({ profile }: ProfileBioProps) {
  if (!profile?.bio) return null;
  return (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        Giới thiệu
      </Text>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-base text-gray-700">{profile.bio}</Text>
      </View>
    </View>
  );
}
