import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import Text from "./Text";
import { theme } from "../../styles/theme";

export type LoadingSize = "sm" | "md" | "lg";
export type LoadingVariant = "default" | "overlay" | "inline";

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  text?: string;
  color?: string;
  style?: ViewStyle;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "default",
  text,
  color = theme.colors.primary[500],
  style,
}) => {
  const getIndicatorSize = () => {
    switch (size) {
      case "sm":
        return "small";
      case "md":
        return "large";
      case "lg":
        return "large";
      default:
        return "large";
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case "overlay":
        return [styles.overlay, style];
      case "inline":
        return [styles.inline, style];
      default:
        return [styles.default, style];
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "caption";
      case "md":
        return "body2";
      case "lg":
        return "body1";
      default:
        return "body2";
    }
  };

  const renderContent = () => (
    <View style={styles.content}>
      <ActivityIndicator
        size={getIndicatorSize()}
        color={color}
        style={[styles.indicator, size === "lg" && styles.largeIndicator]}
      />
      {text && (
        <Text variant={getTextSize()} color="secondary" style={styles.text}>
          {text}
        </Text>
      )}
    </View>
  );

  return <View style={getContainerStyle()}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  default: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  indicator: {
    marginBottom: theme.spacing[2],
  },
  largeIndicator: {
    marginBottom: theme.spacing[3],
  },
  text: {
    marginTop: theme.spacing[2],
  },
});

export default Loading;
