import { useRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
} from "react-native";

interface TextEditorProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  minHeight?: number;
  maxHeight?: number;
  onFocus?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

export function TextEditor({
  label,
  error,
  containerClassName = "",
  minHeight = 120,
  maxHeight = 300,
  onFocus,
  inputRef: externalInputRef,
  ...props
}: TextEditorProps) {
  const internalInputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);
  const inputRef = externalInputRef || internalInputRef;

  const handleFocus = () => {
    onFocus?.();
  };

  return (
    <View ref={containerRef} className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      )}
      <View
        className={`rounded-lg border ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white overflow-hidden`}
      >
        <TextInput
          ref={inputRef}
          {...props}
          multiline
          textAlignVertical="top"
          onFocus={handleFocus}
          style={[
            styles.input,
            {
              minHeight,
              maxHeight,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
            },
          ]}
          className="text-base text-gray-900"
          placeholderTextColor="#9CA3AF"
        />
      </View>
      {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    textAlignVertical: "top",
  },
});
