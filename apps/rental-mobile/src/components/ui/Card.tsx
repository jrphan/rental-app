import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { theme } from "../../styles/theme";

export type CardVariant = "default" | "outlined" | "elevated" | "filled";
export type CardSize = "sm" | "md" | "lg";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  size = "md",
  style,
  onPress,
  disabled = false,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },

  // Variants
  default: {
    backgroundColor: theme.colors.white,
    ...theme.shadow.sm,
  },
  outlined: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  elevated: {
    backgroundColor: theme.colors.white,
    ...theme.shadow.lg,
  },
  filled: {
    backgroundColor: theme.colors.gray[50],
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },

  // Sizes
  smSize: {
    padding: theme.spacing[3],
  },
  mdSize: {
    padding: theme.spacing[4],
  },
  lgSize: {
    padding: theme.spacing[6],
  },

  // States
  disabled: {
    opacity: 0.5,
  },
});

export default Card;
