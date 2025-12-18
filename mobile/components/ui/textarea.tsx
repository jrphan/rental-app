import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  rows?: number;
}

export function Textarea({
  label,
  error,
  containerClassName = "",
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        className={`rounded-lg border px-4 py-3 text-base ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white text-gray-900`}
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{
          minHeight: rows * 20 + 24, // Approximate height based on rows
        }}
        {...props}
      />
      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
    </View>
  );
}

