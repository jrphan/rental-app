import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Primary color from tailwind config: hsl(14, 85%, 48%) -> #EA580C (primary-600)
  const primaryColor = "#EA580C";
  const inactiveColor = "#6B7280";

  // Calculate tab bar height based on safe area insets
  // Base height: 60px (icon + label + spacing)
  // Add safe area bottom inset to avoid being hidden
  const baseHeight = 60;
  const androidBottomPadding = 32; // Minimum padding for Android
  const iosBottomPadding = Math.max(insets.bottom, 10);

  const tabBarHeight =
    Platform.OS === "ios"
      ? baseHeight + iosBottomPadding
      : baseHeight + androidBottomPadding;

  // Base padding for icons and labels
  const basePaddingTop = 8;
  const basePaddingBottom =
    Platform.OS === "ios" ? iosBottomPadding : androidBottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: tabBarHeight,
          paddingBottom: basePaddingBottom,
          paddingTop: basePaddingTop,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "700",
          letterSpacing: 0.2,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "TRANG CHỦ",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="home" size={focused ? 28 : 26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "XE",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? "directions-car" : "directions-car-filled"}
              size={focused ? 28 : 26}
              color={color}
            />
          ),
          // tabBarItemStyle:
          //   user?.role !== USER_ROLES.OWNER
          //     ? {
          //         display: "none",
          //         width: 0,
          //         height: 0,
          //         overflow: "hidden",
          //       }
          //     : undefined,
        }}
      />
      <Tabs.Screen
        name="vehicles/[id]"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "TIN NHẮN",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? "chat-bubble" : "chat-bubble-outline"}
              size={focused ? 28 : 26}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "CÁ NHÂN",
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? "person" : "person-outline"}
              size={focused ? 28 : 26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
