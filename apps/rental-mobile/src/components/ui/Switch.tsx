import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { theme } from "../../styles/theme";

export type SwitchSize = "sm" | "md" | "lg";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  label?: string;
  labelPosition?: "left" | "right";
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
}

const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  size = "md",
  disabled = false,
  label,
  labelPosition = "right",
  activeColor = theme.colors.primary[500],
  inactiveColor = theme.colors.gray[300],
  thumbColor = theme.colors.white,
  style,
}) => {
  const getSizeStyles = () => {
    const sizes = {
      sm: {
        width: 36,
        height: 20,
        thumbSize: 16,
        padding: 2,
      },
      md: {
        width: 44,
        height: 24,
        thumbSize: 20,
        padding: 2,
      },
      lg: {
        width: 52,
        height: 28,
        thumbSize: 24,
        padding: 2,
      },
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();

  const trackStyle = [
    styles.track,
    {
      width: sizeStyles.width,
      height: sizeStyles.height,
      backgroundColor: value ? activeColor : inactiveColor,
      opacity: disabled ? 0.5 : 1,
    },
  ];

  const thumbStyle = [
    styles.thumb,
    {
      width: sizeStyles.thumbSize,
      height: sizeStyles.thumbSize,
      backgroundColor: thumbColor,
      transform: [
        {
          translateX: value
            ? sizeStyles.width - sizeStyles.thumbSize - sizeStyles.padding
            : sizeStyles.padding,
        },
      ],
    },
  ];

  const containerStyle = [styles.container, style];

  const labelStyle = [styles.label, disabled && styles.disabledLabel];

  const renderLabel = () => {
    if (!label) return null;

    return <Text style={labelStyle}>{label}</Text>;
  };

  const renderSwitch = () => (
    <TouchableOpacity
      style={trackStyle}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={thumbStyle} />
    </TouchableOpacity>
  );

  return (
    <View style={containerStyle}>
      {labelPosition === "left" && renderLabel()}
      {renderSwitch()}
      {labelPosition === "right" && renderLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  track: {
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
  },
  thumb: {
    borderRadius: theme.borderRadius.full,
    ...theme.shadow.sm,
  },
  label: {
    marginHorizontal: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.gray[700],
  },
  disabledLabel: {
    opacity: 0.5,
  },
});

export default Switch;
