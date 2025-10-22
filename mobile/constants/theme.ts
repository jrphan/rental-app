/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

// HSL Primary colors - Shopee Orange
const primaryColorLight = "hsl(14, 85%, 55%)"; // ~ #EE4D2D
const primaryColorDark = "hsl(14, 85%, 60%)"; // slightly lighter for dark mode

// HSL Secondary colors - Gray theme
const secondaryColorLight = "hsl(210, 20%, 60%)"; // Gray-500
const secondaryColorDark = "hsl(210, 20%, 70%)"; // Gray-400

// HSL Accent colors - Green theme
const accentColorLight = "hsl(142, 76%, 50%)"; // Green-500
const accentColorDark = "hsl(142, 76%, 60%)"; // Green-400

// HSL Destructive colors - Red theme
const destructiveColorLight = "hsl(0, 86%, 50%)"; // Red-500
const destructiveColorDark = "hsl(0, 86%, 60%)"; // Red-400

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
    // Primary HSL colors (Shopee Orange)
    primary: primaryColorLight,
    primaryForeground: "hsl(0, 0%, 100%)",
    primaryHover: "hsl(14, 85%, 48%)",
    primaryActive: "hsl(14, 85%, 40%)",
    // Secondary HSL colors
    secondary: secondaryColorLight,
    secondaryForeground: "hsl(0, 0%, 100%)",
    secondaryHover: "hsl(210, 20%, 50%)",
    secondaryActive: "hsl(210, 20%, 40%)",
    // Accent HSL colors
    accent: accentColorLight,
    accentForeground: "hsl(0, 0%, 100%)",
    accentHover: "hsl(142, 76%, 45%)",
    accentActive: "hsl(142, 76%, 40%)",
    // Destructive HSL colors
    destructive: destructiveColorLight,
    destructiveForeground: "hsl(0, 0%, 100%)",
    destructiveHover: "hsl(0, 86%, 45%)",
    destructiveActive: "hsl(0, 86%, 40%)",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    // Primary HSL colors (Shopee Orange)
    primary: primaryColorDark,
    primaryForeground: "hsl(0, 0%, 0%)",
    primaryHover: "hsl(14, 85%, 55%)",
    primaryActive: "hsl(14, 85%, 48%)",
    // Secondary HSL colors
    secondary: secondaryColorDark,
    secondaryForeground: "hsl(0, 0%, 0%)",
    secondaryHover: "hsl(210, 20%, 60%)",
    secondaryActive: "hsl(210, 20%, 50%)",
    // Accent HSL colors
    accent: accentColorDark,
    accentForeground: "hsl(0, 0%, 0%)",
    accentHover: "hsl(142, 76%, 50%)",
    accentActive: "hsl(142, 76%, 45%)",
    // Destructive HSL colors
    destructive: destructiveColorDark,
    destructiveForeground: "hsl(0, 0%, 0%)",
    destructiveHover: "hsl(0, 86%, 50%)",
    destructiveActive: "hsl(0, 86%, 45%)",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
