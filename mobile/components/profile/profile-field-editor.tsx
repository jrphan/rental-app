import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  TextInputProps,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TextEditor } from "./text-editor";

export type FieldType = "text" | "date" | "multiline" | "phone" | "editor";

interface ProfileFieldEditorProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: FieldType;
  keyboardType?: TextInputProps["keyboardType"];
  numberOfLines?: number;
  containerClassName?: string;
}

export function ProfileFieldEditor({
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  placeholder,
  disabled = false,
  type = "text",
  keyboardType,
  numberOfLines = 1,
  containerClassName = "",
}: ProfileFieldEditorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Parse date string to Date object
  const dateValue =
    value && value.trim() !== ""
      ? new Date(value)
      : new Date(new Date().getFullYear() - 18, 0, 1); // Default to 18 years ago

  // Format date for display (dd/MM/yyyy)
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr || dateStr.trim() === "") return "";
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Android: Close picker after selection
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        onChange(formattedDate);
        onBlur?.();
      }
    } else {
      // iOS: Update date as user scrolls
      if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split("T")[0];
        onChange(formattedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    setShowDatePicker(false);
    onBlur?.();
  };

  // Date picker field
  if (type === "date") {
    return (
      <View className={`mb-4 ${containerClassName}`}>
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
        <TouchableOpacity
          onPress={() => {
            if (!disabled) {
              setShowDatePicker(true);
            }
          }}
          disabled={disabled}
          className={`rounded-lg border ${
            error ? "border-red-500" : "border-gray-300"
          } bg-white p-4 ${disabled ? "opacity-50" : "active:bg-gray-50"}`}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-base ${
                value ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {value ? formatDate(value) : placeholder || "Chọn ngày sinh"}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color="#EA580C" />
          </View>
        </TouchableOpacity>
        {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}
        {showDatePicker && Platform.OS === "ios" && (
          <Modal
            transparent
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
              className="flex-1 bg-black/50 items-center justify-end"
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="w-full bg-white rounded-t-3xl p-4"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text className="text-base text-gray-600">Hủy</Text>
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-gray-900">
                    {label}
                  </Text>
                  <TouchableOpacity onPress={handleIOSConfirm}>
                    <Text className="text-base font-semibold text-primary-600">
                      Xong
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)}
                  textColor="#000"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)}
          />
        )}
      </View>
    );
  }

  // Editor field (uses TextEditor component)
  if (type === "editor") {
    return (
      <TextEditor
        label={label}
        value={value || ""}
        onChangeText={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        error={error}
        placeholder={placeholder}
        editable={!disabled}
        keyboardType={keyboardType}
        containerClassName={containerClassName}
        minHeight={numberOfLines > 1 ? numberOfLines * 30 : 120}
        maxHeight={300}
      />
    );
  }

  // Text input field (text, phone, multiline)
  const isMultiline = type === "multiline" || numberOfLines > 1;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        value={value || ""}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        editable={!disabled}
        multiline={isMultiline}
        numberOfLines={isMultiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        className={`rounded-lg border px-4 py-3 text-base ${
          error ? "border-red-500" : "border-gray-300"
        } bg-white text-gray-900 ${
          isMultiline ? "min-h-[100px] text-top" : ""
        } ${disabled ? "opacity-50" : ""}`}
        textAlignVertical={isMultiline ? "top" : "center"}
      />
      {error && <Text className="mt-1 text-sm text-red-600">{error}</Text>}
    </View>
  );
}
