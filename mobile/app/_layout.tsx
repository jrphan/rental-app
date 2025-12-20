import "@/css/global.css";
import "react-native-css-interop/jsx-runtime";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import { ToastContainer } from "@/components/ui/toast";
import { useSyncUser } from "@/hooks/user/useSyncUser";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  // Sync user info với server mỗi lần app khởi động
  // Nếu API fail (token hết hạn hoặc user không tồn tại) thì tự động logout
  useSyncUser();

  // Register for push notifications
  usePushNotifications();

  return (
    <Stack screenOptions={{ headerShown: false, animation: "flip" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="vehicle/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={DefaultTheme}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
            <ToastContainer />
            <StatusBar style="dark" translucent={false} />
          </QueryClientProvider>
        </SafeAreaProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
