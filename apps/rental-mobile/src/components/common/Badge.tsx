import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../../styles/theme";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error";
export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  dot?: boolean;
  max?: number;
  count?: number;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  style,
  dot = false,
  max = 99,
  count,
}) => {
  // If it's a dot badge
  if (dot) {
    return <View style={[styles.dot, styles[variant], style]}>{children}</View>;
  }

  // If it's a count badge
  if (typeof count === "number") {
    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <View style={[styles.countBadge, styles[variant], style]}>
        <Text style={[styles.countText, styles[`${variant}Text`]]}>
          {displayCount}
        </Text>
        {children}
      </View>
    );
  }

  // Regular badge
  return (
    <View style={[styles.badge, styles[variant], styles[`${size}Size`], style]}>
      <Text
        style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },

  badge: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    alignItems: "center",
    justifyContent: "center",
  },

  // Badge variants
  default: {
    backgroundColor: theme.colors.gray[100],
  },
  primary: {
    backgroundColor: theme.colors.primary[100],
  },
  secondary: {
    backgroundColor: theme.colors.secondary[100],
  },
  success: {
    backgroundColor: theme.colors.success[100],
  },
  warning: {
    backgroundColor: theme.colors.warning[100],
  },
  error: {
    backgroundColor: theme.colors.error[100],
  },

  // Badge sizes
  smSize: {
    paddingHorizontal: theme.spacing[1],
    paddingVertical: theme.spacing[1],
  },
  mdSize: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
  },
  lgSize: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },

  // Badge text colors
  defaultText: {
    color: theme.colors.gray[700],
  },
  primaryText: {
    color: theme.colors.primary[700],
  },
  secondaryText: {
    color: theme.colors.secondary[700],
  },
  successText: {
    color: theme.colors.success[700],
  },
  warningText: {
    color: theme.colors.warning[700],
  },
  errorText: {
    color: theme.colors.error[700],
  },

  // Badge text sizes
  smText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "600",
  },
  mdText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "600",
  },
  lgText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
  },

  // Dot badge
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    top: -2,
    right: -2,
    zIndex: 1,
  },

  // Count badge
  countBadge: {
    position: "relative",
  },
  countText: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error[500],
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    textAlign: "center",
    zIndex: 1,
  },
});

export default Badge;
