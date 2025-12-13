import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

type TabItem = {
  name: "index" | "vehicles" | "messages" | "profile";
  title: string;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  inactiveIcon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const primaryColor = COLORS.primary;
  const inactiveColor = COLORS.inactive;

  const baseHeight = 60;
  const androidBottomPadding = 32;
  const iosBottomPadding = Math.max(insets.bottom, 10);

  const tabBarHeight =
    Platform.OS === "ios"
      ? baseHeight + iosBottomPadding
      : baseHeight + androidBottomPadding;
  const basePaddingTop = 8;
  const basePaddingBottom =
    Platform.OS === "ios" ? iosBottomPadding : androidBottomPadding;

  const tabItems: TabItem[] = [
    {
      name: "index",
      title: "TRANG CHỦ",
      activeIcon: "home-variant",
      inactiveIcon: "home-variant-outline",
    },
    {
      name: "vehicles",
      title: "XE",
      activeIcon: "motorbike",
      inactiveIcon: "motorbike",
    },
    {
      name: "messages",
      title: "TIN NHẮN",
      activeIcon: "chat-processing",
      inactiveIcon: "chat-outline",
    },
    {
      name: "profile",
      title: "CÁ NHÂN",
      activeIcon: "account-circle",
      inactiveIcon: "account-circle-outline",
    },
  ];

  const tabBarStyle = {
    backgroundColor: "#FFFFFF",
    height: tabBarHeight,
    paddingBottom: basePaddingBottom,
    paddingTop: basePaddingTop,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  };

  const tabBarLabelStyle = {
    fontSize: 10.5,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    marginTop: 2,
    marginBottom: 0,
  };

  const tabBarIconStyle = { marginTop: 2 };
  const tabBarItemStyle = { paddingVertical: 6 };

  const renderTabIcon = (item: TabItem, color: string, focused: boolean) => {
    if (item.name !== "messages") {
      return (
        <MaterialCommunityIcons
          name={focused ? item.activeIcon : item.inactiveIcon}
          size={focused ? 26 : 24}
          color={color}
        />
      );
    }

    return (
      <View className="relative">
        <MaterialCommunityIcons
          name={focused ? item.activeIcon : item.inactiveIcon}
          size={focused ? 26 : 24}
          color={color}
        />
        {/* {typeof unreadCount === "number" && unreadCount > 0 && (
          <View className="absolute -top-1 -right-2 min-w-5 h-5 px-1.5 items-center justify-center rounded-full border-2 border-white bg-primary-600">
            <Text className="text-white text-[10px] font-bold">
              {unreadCount > 99 ? "99+" : String(unreadCount)}
            </Text>
          </View>
        )} */}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle,
        tabBarLabelStyle,
        tabBarIconStyle,
        tabBarItemStyle,
        animation: "shift",
      }}
    >
      {tabItems.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ color, focused }) =>
              renderTabIcon(item, color, focused),
          }}
        />
      ))}
    </Tabs>
  );
}
