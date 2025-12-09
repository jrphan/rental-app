import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Input } from "@/components/ui/input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { TextInputProps } from "react-native";
import { COLORS } from "@/constants/colors";

type PasswordInputProps = {
  toggleClassName?: string;
} & Omit<TextInputProps, "secureTextEntry"> & {
    label?: string;
    error?: string;
    containerClassName?: string;
  };

export function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  containerClassName,
  autoComplete = "password",
  editable = true,
  toggleClassName = "absolute right-4 top-9",
  ...rest
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View className={`relative ${containerClassName ?? ""}`}>
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={error}
        secureTextEntry={!isVisible}
        autoComplete={autoComplete}
        editable={editable}
        // Keep Input's own spacing; external callers need not add mb-4 again
      />
      <TouchableOpacity
        onPress={() => setIsVisible((v) => !v)}
        className={toggleClassName}
        accessibilityRole="button"
        accessibilityLabel={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        <IconSymbol
          name={isVisible ? "eye" : "eye.slash"}
          size={22}
          color={COLORS.primary}
        />
      </TouchableOpacity>
    </View>
  );
}
