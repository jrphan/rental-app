import "@/css/global.css";
import "react-native-css-interop/jsx-runtime";
import "react-native-reanimated";
import { Stack, Redirect, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";

import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <StatusBar style="dark" />
      </QueryClientProvider>
    </NavigationThemeProvider>
  );
}
