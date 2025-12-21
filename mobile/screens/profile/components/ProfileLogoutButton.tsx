import { Alert, Text, View } from "react-native";
import { Button } from "@/components/ui/button";

interface ProfileLogoutButtonProps {
  onLogout: () => void;
  isLoading?: boolean;
}

export default function ProfileLogoutButton({
  onLogout,
  isLoading = false,
}: ProfileLogoutButtonProps) {
  const confirmLogout = () =>
    Alert.alert("Xác nhận", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: onLogout },
    ]);

  return (
    <View
      style={{
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      }}
    >
      <Button
        onPress={confirmLogout}
        variant="destructive"
        className="shadow-lg"
        size="lg"
        disabled={isLoading}
      >
        <Text className="text-center text-base font-bold text-white">
          {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
        </Text>
      </Button>
    </View>
  );
}
