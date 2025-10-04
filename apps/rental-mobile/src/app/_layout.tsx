import React from "react";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Toast />
      </AuthProvider>
    </QueryProvider>
  );
}
