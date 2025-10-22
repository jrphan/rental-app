import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const buttonVariants = {
  primary: "bg-primary-500 active:bg-primary-600",
  secondary: "bg-secondary-200 active:bg-secondary-300",
  outline: "border border-neutral-300 bg-transparent active:bg-neutral-50",
  ghost: "bg-transparent active:bg-neutral-100",
  destructive: "bg-destructive-500 active:bg-destructive-600",
};

const buttonSizes = {
  sm: "px-3 py-2 rounded-md",
  md: "px-4 py-2.5 rounded-lg",
  lg: "px-6 py-3 rounded-lg",
  xl: "px-8 py-4 rounded-xl",
};

const textVariants = {
  primary: "text-white font-semibold",
  secondary: "text-neutral-900 font-semibold",
  outline: "text-neutral-900 font-semibold",
  ghost: "text-neutral-900 font-semibold",
  destructive: "text-white font-semibold",
};

const textSizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onPress,
  className,
  textClassName,
  icon,
  iconPosition = "left",
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonClasses = cn(
    "flex-row items-center justify-center",
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && "w-full",
    isDisabled && "opacity-50",
    className
  );

  const textClasses = cn(textVariants[variant], textSizes[size], textClassName);

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-row items-center">
          <ActivityIndicator
            size="small"
            color={
              variant === "primary" || variant === "destructive"
                ? "white"
                : "gray"
            }
          />
          {children && (
            <Text className={cn(textClasses, "ml-2")}>{children}</Text>
          )}
        </View>
      );
    }

    if (icon && children) {
      return (
        <View className="flex-row items-center">
          {iconPosition === "left" && <View className="mr-2">{icon}</View>}
          <Text className={textClasses}>{children}</Text>
          {iconPosition === "right" && <View className="ml-2">{icon}</View>}
        </View>
      );
    }

    if (icon && !children) {
      return icon;
    }

    return <Text className={textClasses}>{children}</Text>;
  };

  return (
    <TouchableOpacity
      className={buttonClasses}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}
