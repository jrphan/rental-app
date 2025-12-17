import { COLORS } from "@/constants/colors";
import type { NotificationItem } from "./types";

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case "booking":
      return "directions-car";
    case "message":
      return "message";
    case "payment":
      return "payment";
    case "system":
      return "info";
    default:
      return "notifications";
  }
};

export const getNotificationColor = (type: string) => {
  switch (type) {
    case "booking":
      return COLORS.primary;
    case "message":
      return "#3B82F6";
    case "payment":
      return "#10B981";
    case "system":
      return "#6B7280";
    default:
      return COLORS.primary;
  }
};

