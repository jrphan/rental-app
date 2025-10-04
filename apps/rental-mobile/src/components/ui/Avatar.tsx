import React from "react";
import { View, Image, Text, StyleSheet, ViewStyle } from "react-native";
import { theme } from "../../styles/theme";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  backgroundColor?: string;
  textColor?: string;
  showBorder?: boolean;
  borderColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name = "",
  size = "md",
  style,
  backgroundColor = theme.colors.primary[500],
  textColor = theme.colors.white,
  showBorder = false,
  borderColor = theme.colors.gray[200],
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeStyles = () => {
    const sizes = {
      xs: { size: 24, fontSize: 10 },
      sm: { size: 32, fontSize: 12 },
      md: { size: 40, fontSize: 14 },
      lg: { size: 48, fontSize: 16 },
      xl: { size: 56, fontSize: 18 },
      "2xl": { size: 64, fontSize: 20 },
    };
    return sizes[size];
  };

  const sizeStyles = getSizeStyles();

  const avatarStyle = [
    styles.avatar,
    {
      width: sizeStyles.size,
      height: sizeStyles.size,
      borderRadius: sizeStyles.size / 2,
      backgroundColor: source ? theme.colors.transparent : backgroundColor,
    },
    showBorder && {
      borderWidth: 2,
      borderColor,
    },
    style,
  ];

  const textStyle = [
    styles.text,
    {
      fontSize: sizeStyles.fontSize,
      color: textColor,
    },
  ];

  return (
    <View style={avatarStyle}>
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: sizeStyles.size,
              height: sizeStyles.size,
              borderRadius: sizeStyles.size / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>{getInitials(name)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});

export default Avatar;
