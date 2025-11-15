import { SafeAreaView } from "react-native-safe-area-context";
import { View, TouchableOpacity, Text, StatusBar } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, usePathname } from "expo-router";
import { useRequirePhoneVerification } from "@/lib/auth";
import ChatTab from "./chat";
import NotificationsTab from "./notifications";

export default function MessagesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { requirePhoneVerification } = useRequirePhoneVerification({
    message: "Vui lòng xác minh số điện thoại để sử dụng tin nhắn",
  });

  // Check phone verification
  // if (!requirePhoneVerification()) {
  //   return null;
  // }

  const isChatTab =
    pathname?.includes("/chat") ||
    pathname === "/(tabs)/messages" ||
    pathname === "/(tabs)/messages/";

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Tin nhắn</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Custom Tabs */}
        <View className="flex-row border-b border-gray-200 bg-white">
          <TouchableOpacity
            className="flex-1 py-3 items-center border-b-2"
            style={{
              borderBottomColor: isChatTab ? "#EA580C" : "transparent",
            }}
            onPress={() => router.push("/(tabs)/messages/chat")}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: isChatTab ? "#EA580C" : "#6B7280" }}
            >
              Nhắn tin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 items-center border-b-2"
            style={{
              borderBottomColor: !isChatTab ? "#EA580C" : "transparent",
            }}
            onPress={() => router.push("/(tabs)/messages/notifications")}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: !isChatTab ? "#EA580C" : "#6B7280" }}
            >
              Thông báo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1">
          {isChatTab ? <ChatTab /> : <NotificationsTab />}
        </View>
      </SafeAreaView>
    </>
  );
}
