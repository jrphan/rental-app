import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { theme } from "../../styles/theme";

export type InputVariant = "default" | "outline" | "filled" | "underlined";
export type InputSize = "sm" | "md" | "lg";
export type InputStatus = "default" | "error" | "success" | "warning";

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: InputVariant;
  size?: InputSize;
  status?: InputStatus;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  helperText,
  errorText,
  variant = "outline",
  size = "md",
  status = "default",
  disabled = false,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  required = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  const hasError = status === "error" || !!errorText;
  const hasSuccess = status === "success";

  const containerStyle = [styles.container, style];

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    styles[`${size}Size`],
    isFocused && styles.focused,
    hasError && styles.error,
    hasSuccess && styles.success,
    disabled && styles.disabled,
    multiline && styles.multiline,
  ];

  const textInputStyle = [
    styles.input,
    styles[`${size}Text`],
    multiline && styles.multilineInput,
    inputStyle,
  ];

  const labelStyle = [
    styles.label,
    hasError && styles.errorText,
    required && styles.requiredLabel,
  ];

  const helperStyle = [
    styles.helperText,
    hasError && styles.errorText,
    hasSuccess && styles.successText,
  ];

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyle}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={textInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.gray[400]}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsSecure(!isSecure)}
          >
            <Text style={styles.eyeIcon}>{isSecure ? "👁️" : "🙈"}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(helperText || errorText) && (
        <Text style={helperStyle}>{errorText || helperText}</Text>
      )}

      {maxLength && (
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[4],
  },

  // Input container variants
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
  },

  default: {
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.gray[50],
  },
  outline: {
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.white,
  },
  filled: {
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.gray[100],
  },
  underlined: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    backgroundColor: theme.colors.transparent,
  },

  // Sizes
  smSize: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  mdSize: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  lgSize: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[4],
  },

  // Input text sizes
  smText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.base,
  },
  lgText: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.lg,
  },

  // Input styles
  input: {
    flex: 1,
    color: theme.colors.gray[900],
    fontWeight: "400",
  },
  multiline: {
    alignItems: "flex-start",
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },

  // States
  focused: {
    borderColor: theme.colors.primary[500],
    ...theme.shadow.sm,
  },
  error: {
    borderColor: theme.colors.error[500],
  },
  success: {
    borderColor: theme.colors.success[500],
  },
  disabled: {
    backgroundColor: theme.colors.gray[100],
    opacity: 0.6,
  },

  // Label
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.gray[700],
    marginBottom: theme.spacing[2],
  },
  requiredLabel: {
    fontWeight: "600",
  },
  required: {
    color: theme.colors.error[500],
  },

  // Helper text
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[500],
    marginTop: theme.spacing[1],
  },
  errorText: {
    color: theme.colors.error[500],
  },
  successText: {
    color: theme.colors.success[600],
  },

  // Icons
  leftIcon: {
    marginRight: theme.spacing[2],
  },
  rightIcon: {
    marginLeft: theme.spacing[2],
    padding: theme.spacing[1],
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Counter
  counter: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.gray[400],
    textAlign: "right",
    marginTop: theme.spacing[1],
  },
});

export default Input;
