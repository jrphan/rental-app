import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";

interface ProfileLogoutButtonProps {
  onLogout: () => void;
}

export default function ProfileLogoutButton({
  onLogout,
}: ProfileLogoutButtonProps) {
  return (
    <View className="mx-6">
      <Button
        onPress={onLogout}
        variant="destructive"
        className="mb-24"
        size="lg"
      >
        <Text className="text-center text-base font-semibold text-white">
          Đăng xuất
        </Text>
      </Button>
    </View>
  );
}
