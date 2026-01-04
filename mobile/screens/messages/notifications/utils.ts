import { COLORS } from "@/constants/colors";

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case "booking":
      return "motorcycle";
    case "message":
      return "message";
    case "payment":
      return "payment";
    case "system":
      return "info";
    case "success":
      return "check-circle";
    case "warning":
      return "warning";
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
    case "success":
      return "#10B981";
    case "warning":
      return "#ef4444";
    default:
      return COLORS.primary;
  }
};
