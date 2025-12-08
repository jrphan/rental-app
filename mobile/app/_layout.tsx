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

import { queryClient } from "@/lib/queryClient";
import { ToastContainer } from "@/components/ui/toast";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
          <ToastContainer />
          <StatusBar style="dark" translucent={false} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </NavigationThemeProvider>
  );
}
