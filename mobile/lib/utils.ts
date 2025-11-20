import { clsx, type ClassValue } from "clsx";
import Constants from "expo-constants";
import { Platform } from "react-native";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Resolve API URL - tự động thay localhost bằng IP network khi chạy trên thiết bị thật
 *
 * Trên thiết bị thật, localhost sẽ không hoạt động vì trỏ về chính thiết bị đó.
 * Function này sẽ tự động thay localhost bằng IP network từ EXPO_PUBLIC_API_IP
 * hoặc từ debuggerHost trong Constants.
 *
 * @param url - URL gốc từ EXPO_PUBLIC_API_URL
 * @returns URL đã được resolve (localhost -> IP network)
 */
export function resolveApiUrl(url: string): string {
  if (!url) return url;

  // Chỉ xử lý khi URL chứa localhost hoặc 127.0.0.1
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    return url;
  }

  // Trên web hoặc simulator/emulator, giữ nguyên localhost
  if (Platform.OS === "web") {
    return url;
  }

  // Lấy IP từ environment variable (ưu tiên)
  const apiIP = process.env.EXPO_PUBLIC_API_IP;
  if (apiIP) {
    return url.replace(/localhost|127\.0\.0\.1/, apiIP);
  }

  // Thử lấy IP từ debuggerHost (Expo tự động set khi chạy trên device thật)
  // Thử nhiều cách để lấy IP từ Constants
  let debuggerHost: string | undefined;

  // Cách 1: Constants.expoConfig.hostUri
  if (Constants.expoConfig?.hostUri) {
    debuggerHost = Constants.expoConfig.hostUri.split(":")[0];
  }

  // Cách 2: Constants.manifest2?.extra?.expoGo?.debuggerHost
  if (
    !debuggerHost &&
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost
  ) {
    debuggerHost = (Constants.manifest2 as any).extra.expoGo.debuggerHost.split(
      ":"
    )[0];
  }

  // Cách 3: Constants.manifest?.debuggerHost (legacy)
  if (!debuggerHost && (Constants.manifest as any)?.debuggerHost) {
    debuggerHost = (Constants.manifest as any).debuggerHost.split(":")[0];
  }

  if (
    debuggerHost &&
    debuggerHost !== "localhost" &&
    !debuggerHost.includes("127.0.0.1") &&
    !debuggerHost.includes("::")
  ) {
    return url.replace(/localhost|127\.0\.0\.1/, debuggerHost);
  }

  // Fallback: nếu không tìm thấy IP, giữ nguyên (sẽ báo lỗi khi chạy trên device thật)
  // User cần set EXPO_PUBLIC_API_IP trong .env hoặc app.config.js
  console.warn(
    "⚠️  API URL chứa localhost nhưng không tìm thấy IP network. " +
      "Vui lòng set EXPO_PUBLIC_API_IP trong environment variable hoặc app.config.js. " +
      "Hoặc sử dụng IP máy tính của bạn thay cho localhost."
  );

  return url;
}
export function normalize(str: string) {
  return (str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}