import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function SubtabsLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="addresses" />
        <Stack.Screen name="favorite_vehicles" />
        <Stack.Screen name="vehicle_registration" />
        <Stack.Screen name="kyc_documents" />
        <Stack.Screen name="payment_methods" />
        <Stack.Screen name="profile_detail" />
        <Stack.Screen name="change_password" />
      </Stack>
    </SafeAreaProvider>
  );
}
