import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "@/lib/utils";

interface LabelProps extends TextProps {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <Text
      className={cn("mb-2 text-sm font-medium text-gray-700", className)}
      {...props}
    >
      {children}
      {required && <Text className="text-red-500"> *</Text>}
    </Text>
  );
}
