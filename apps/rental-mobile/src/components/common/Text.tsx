import React from "react";
import { Text as RNText, TextStyle, StyleSheet } from "react-native";
import { theme } from "../../styles/theme";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body1"
  | "body2"
  | "caption"
  | "overline"
  | "button"
  | "link";

export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor =
  | "primary"
  | "secondary"
  | "tertiary"
  | "success"
  | "warning"
  | "error"
  | "white"
  | "black";

export type TextAlign = "left" | "center" | "right" | "justify";

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  numberOfLines?: number;
  style?: TextStyle;
  onPress?: () => void;
  selectable?: boolean;
}

const Text: React.FC<TextProps> = ({
  children,
  variant = "body1",
  weight = "normal",
  color = "primary",
  align = "left",
  numberOfLines,
  style,
  onPress,
  selectable = false,
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    styles[`${weight}Weight`],
    styles[`${color}Color`],
    styles[`${align}Align`],
    style,
  ];

  return (
    <RNText
      style={textStyle}
      numberOfLines={numberOfLines}
      onPress={onPress}
      selectable={selectable}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.typography.fontFamily.regular,
  },

  // Variants
  h1: {
    fontSize: theme.typography.fontSize["4xl"],
    lineHeight: theme.typography.lineHeight["4xl"],
    fontWeight: "bold",
  },
  h2: {
    fontSize: theme.typography.fontSize["3xl"],
    lineHeight: theme.typography.lineHeight["3xl"],
    fontWeight: "bold",
  },
  h3: {
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight["2xl"],
    fontWeight: "600",
  },
  h4: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.xl,
    fontWeight: "600",
  },
  h5: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
    fontWeight: "600",
  },
  h6: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
    fontWeight: "600",
  },
  body1: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
  },
  body2: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
  },
  overline: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
    fontWeight: "600",
  },
  link: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
    textDecorationLine: "underline",
    color: theme.colors.primary[600],
  },

  // Weights
  normalWeight: {
    fontWeight: "400",
  },
  mediumWeight: {
    fontWeight: "500",
  },
  semiboldWeight: {
    fontWeight: "600",
  },
  boldWeight: {
    fontWeight: "700",
  },

  // Colors
  primaryColor: {
    color: theme.colors.gray[900],
  },
  secondaryColor: {
    color: theme.colors.gray[600],
  },
  tertiaryColor: {
    color: theme.colors.gray[400],
  },
  successColor: {
    color: theme.colors.success[600],
  },
  warningColor: {
    color: theme.colors.warning[600],
  },
  errorColor: {
    color: theme.colors.error[600],
  },
  whiteColor: {
    color: theme.colors.white,
  },
  blackColor: {
    color: theme.colors.black,
  },

  // Alignment
  leftAlign: {
    textAlign: "left",
  },
  centerAlign: {
    textAlign: "center",
  },
  rightAlign: {
    textAlign: "right",
  },
  justifyAlign: {
    textAlign: "justify",
  },
});

export default Text;
