import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "flip",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="commissions" />
    </Stack>
  );
}
