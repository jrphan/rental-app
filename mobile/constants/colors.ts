export const COLORS = {
  primary: "#EA580C",
  inactive: "#6B7280",
  white: "#FFFFFF",
  gray200: "#E5E7EB",
  shadow: "#000000",
} as const;

export type ColorKey = keyof typeof COLORS;
