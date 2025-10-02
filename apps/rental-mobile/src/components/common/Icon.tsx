import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { theme } from "../../styles/theme";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type IconName =
  | "home"
  | "user"
  | "search"
  | "settings"
  | "menu"
  | "close"
  | "check"
  | "plus"
  | "minus"
  | "edit"
  | "delete"
  | "save"
  | "cancel"
  | "back"
  | "forward"
  | "up"
  | "down"
  | "left"
  | "right"
  | "star"
  | "heart"
  | "share"
  | "download"
  | "upload"
  | "camera"
  | "image"
  | "file"
  | "folder"
  | "calendar"
  | "clock"
  | "location"
  | "phone"
  | "email"
  | "lock"
  | "unlock"
  | "eye"
  | "eye-off"
  | "bell"
  | "notification"
  | "warning"
  | "info"
  | "error"
  | "success"
  | "question"
  | "help";

interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  style?: TextStyle;
}

const iconMap: Record<IconName, string> = {
  home: "🏠",
  user: "👤",
  search: "🔍",
  settings: "⚙️",
  menu: "☰",
  close: "✕",
  check: "✓",
  plus: "+",
  minus: "−",
  edit: "✏️",
  delete: "🗑️",
  save: "💾",
  cancel: "✕",
  back: "←",
  forward: "→",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  star: "⭐",
  heart: "❤️",
  share: "📤",
  download: "⬇️",
  upload: "⬆️",
  camera: "📷",
  image: "🖼️",
  file: "📄",
  folder: "📁",
  calendar: "📅",
  clock: "🕐",
  location: "📍",
  phone: "📞",
  email: "📧",
  lock: "🔒",
  unlock: "🔓",
  eye: "👁️",
  "eye-off": "🙈",
  bell: "🔔",
  notification: "🔔",
  warning: "⚠️",
  info: "ℹ️",
  error: "❌",
  success: "✅",
  question: "❓",
  help: "❓",
};

const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  color = theme.colors.gray[700],
  style,
}) => {
  const getSizeStyles = () => {
    const sizes = {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
    };
    return sizes[size];
  };

  const iconStyle = [
    styles.icon,
    {
      fontSize: getSizeStyles(),
      color,
    },
    style,
  ];

  return <Text style={iconStyle}>{iconMap[name] || "?"}</Text>;
};

const styles = StyleSheet.create({
  icon: {
    textAlign: "center",
    lineHeight: undefined,
  },
});

export default Icon;
