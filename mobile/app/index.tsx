import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
