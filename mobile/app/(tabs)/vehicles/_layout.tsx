import { Stack } from "expo-router";

export default function VehiclesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        // Lazy load screens to improve performance
        lazy: true,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
