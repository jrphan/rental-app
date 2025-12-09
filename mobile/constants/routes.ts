import { RelativePathString } from "expo-router";

interface RoutesType {
  HOME: RelativePathString;
  BOOKINGS: RelativePathString;
  PROFILE: RelativePathString;
  SETTINGS: RelativePathString;
  LOGIN: RelativePathString;
  REGISTER: RelativePathString;
  FORGOT_PASSWORD: RelativePathString;
  VERIFY_OTP: ([userId, email]: [string, string]) => RelativePathString;
  RESET_PASSWORD: RelativePathString;
}

const ROUTES = {
  //Tabs routes
  HOME: "/(tabs)" as RelativePathString,
  BOOKINGS: "/(tabs)/bookings" as RelativePathString,
  PROFILE: "/(tabs)/profile" as RelativePathString,
  SETTINGS: "/(tabs)/settings" as RelativePathString,

  //Auth routes
  LOGIN: "/(auth)/login" as RelativePathString,
  REGISTER: "/(auth)/register" as RelativePathString,
  FORGOT_PASSWORD: "/(auth)/forgot-password" as RelativePathString,
  VERIFY_OTP: ([userId, email]: [string, string]) =>
    `/(auth)/verify-otp?userId=${encodeURIComponent(
      userId
    )}&email=${encodeURIComponent(email)}` as RelativePathString,
  RESET_PASSWORD: "/(auth)/reset-password" as RelativePathString,
} satisfies RoutesType;

export default ROUTES;
