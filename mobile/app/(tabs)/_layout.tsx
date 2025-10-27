import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          height: 80,
          paddingBottom: 30,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="magnifyingglass" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
