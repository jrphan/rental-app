import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = "",
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-lg border px-4 py-3 text-base ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}
