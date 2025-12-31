import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

interface DatePickerProps {
  label?: string;
  /** Giá trị raw lưu trong form (tùy vào mode, nhưng luôn là string) */
  value?: string;
  /** Emit giá trị raw đã format phù hợp với mode */
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  mode?: "date" | "time" | "datetime";
  allowClear?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  error,
  mode = "date",
  allowClear = false,
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const parseDate = (input?: string) => {
    if (!input) return new Date();

    if (mode === "time") {
      const [h, m] = input.split(":");
      const base = new Date();
      if (!h || !m) return base;
      base.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
      return base;
    }

    if (mode === "datetime" && input.includes(" ")) {
      const [datePart, timePart] = input.split(" ");
      const [year, month, day] = datePart.split("-");
      const [hours, minutes] = (timePart || "").split(":");
      const d = new Date();
      d.setFullYear(Number(year) || d.getFullYear());
      d.setMonth((Number(month) || 1) - 1);
      d.setDate(Number(day) || 1);
      d.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
      return d;
    }

    const d = new Date(input);
    if (isNaN(d.getTime())) return new Date();
    return d;
  };

  const formatDisplay = (val?: string): string => {
    if (!val) return placeholder;
    const d = parseDate(val);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    if (mode === "time") {
      return `${hours}:${minutes}`;
    }

    if (mode === "datetime") {
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // mode === "date"
    return `${day}/${month}/${year}`;
  };

  const formatInternal = (d: Date): string => {
    // Normalize date to start of day when mode is "date"
    const normalizedDate = mode === "date" ? new Date(d) : d;
    if (mode === "date") {
      normalizedDate.setHours(0, 0, 0, 0);
    }

    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, "0");
    const day = String(normalizedDate.getDate()).padStart(2, "0");
    const hours = String(normalizedDate.getHours()).padStart(2, "0");
    const minutes = String(normalizedDate.getMinutes()).padStart(2, "0");

    if (mode === "time") {
      return `${hours}:${minutes}`;
    }

    if (mode === "datetime") {
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // mode === "date"
    return `${year}-${month}-${day}`;
  };

  const currentDate = parseDate(value);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (event.type === "set" && selectedDate) {
        onChange?.(formatInternal(selectedDate));
      }
      return;
    }

    // iOS: chỉ lưu tempDate, chờ user nhấn "Lưu"
    if (!selectedDate) {
      return;
    }
    setTempDate(selectedDate);
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>
      )}

      <View className="relative">
        <TouchableOpacity
          onPress={() => {
            setTempDate(currentDate);
            setShow(true);
          }}
          className={`rounded-lg border px-4 py-3 bg-white pr-10 ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        >
          <Text
            className={
              value ? "text-gray-900 text-base" : "text-gray-400 text-base"
            }
          >
            {formatDisplay(value)}
          </Text>
        </TouchableOpacity>

        {allowClear && value ? (
          <TouchableOpacity
            onPress={() => onChange?.("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <MaterialIcons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}

      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={currentDate}
          mode={mode}
          display="default"
          onChange={handleChange}
          locale="vi"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === "ios" && show && (
        <Modal
          transparent
          animationType="slide"
          visible={show}
          onRequestClose={() => setShow(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShow(false)}
            className="flex-1 bg-black/50 items-center justify-end"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl p-4"
            >
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <Text className="text-lg font-semibold text-gray-900">
                  {label || "Chọn ngày giờ"}
                </Text>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity onPress={() => setShow(false)}>
                    <Text className="text-base text-gray-600 font-medium">
                      Hủy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const finalDate = tempDate || currentDate;
                      onChange?.(formatInternal(finalDate));
                      setShow(false);
                    }}
                  >
                    <Text className="text-base text-primary-600 font-medium">
                      Lưu
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <DateTimePicker
                value={tempDate || currentDate}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                locale="vi"
                themeVariant="light"
                textColor="black"
                accentColor="black"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
