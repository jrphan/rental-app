import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for store to hydrate
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  // Always redirect to tabs - no auth required
  return <Redirect href="/(tabs)" />;
}
