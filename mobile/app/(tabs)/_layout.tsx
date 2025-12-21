import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { apiNotification } from "@/services/api.notification";
import { useNotificationSocket } from "@/hooks/notifications/useNotificationSocket";
import { useAuthStore } from "@/store/auth";
import { useState, useEffect, useMemo, useCallback } from "react";

type TabItem = {
  name: "index" | "vehicles" | "messages" | "profile";
  title: string;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  inactiveIcon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch unread count from API (initial load only, updates via WebSocket)
  const { data: unreadCountData } = useQuery({
    queryKey: ["notificationUnreadCount"],
    queryFn: () => apiNotification.getUnreadCount(),
    enabled: isAuthenticated,
  });

  // Update unread count from API response
  useEffect(() => {
    if (unreadCountData?.count !== undefined) {
      setUnreadCount(unreadCountData.count);
    }
  }, [unreadCountData]);

  // Setup WebSocket for real-time unread count updates
  const { isConnected } = useNotificationSocket({
    enabled: isAuthenticated,
    onUnreadCountUpdate: (count) => {
      setUnreadCount(count);
    },
  });

  console.log("isConnected", isConnected);

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

  const tabItems: TabItem[] = useMemo(
    () => [
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
    ],
    []
  );

  // Memoize tab bar styles to avoid recreating on every render
  const tabBarStyle = useMemo(
    () => ({
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
    }),
    [tabBarHeight, basePaddingBottom, basePaddingTop]
  );

  const tabBarLabelStyle = useMemo(
    () => ({
      fontSize: 10.5,
      fontWeight: "700" as const,
      letterSpacing: 0.2,
      marginTop: 2,
      marginBottom: 0,
    }),
    []
  );

  const tabBarIconStyle = useMemo(() => ({ marginTop: 2 }), []);
  const tabBarItemStyle = useMemo(() => ({ paddingVertical: 6 }), []);

  // Memoize renderTabIcon callback using useCallback
  const renderTabIcon = useCallback(
    (item: TabItem, color: string, focused: boolean) => {
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
          {typeof unreadCount === "number" && unreadCount > 0 && (
            <View className="absolute -top-1 -right-2 min-w-5 h-5 px-1.5 items-center justify-center rounded-full border-2 border-white bg-primary-600">
              <Text className="text-white text-[10px] font-bold">
                {unreadCount > 99 ? "99+" : String(unreadCount)}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [unreadCount]
  );

  // Memoize screenOptions to avoid recreating on every render
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: primaryColor,
      tabBarInactiveTintColor: inactiveColor,
      tabBarStyle,
      tabBarLabelStyle,
      tabBarIconStyle,
      tabBarItemStyle,
      animation: "shift" as const,
      // Lazy load screens to improve performance - only render when tab is visited
      lazy: true,
    }),
    [
      primaryColor,
      inactiveColor,
      tabBarStyle,
      tabBarLabelStyle,
      tabBarIconStyle,
      tabBarItemStyle,
    ]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      {tabItems.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: item.title,
            tabBarIcon: ({ color, focused }) =>
              renderTabIcon(item, color, focused),
            // Enable lazy loading for each tab screen
            lazy: true,
          }}
        />
      ))}
    </Tabs>
  );
}
