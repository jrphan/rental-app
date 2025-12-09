import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";

export interface SelectOption<T = string> {
  label: string;
  value: T;
  icon?: string;
}

interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value?: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function Select<T = string>({
  options,
  value,
  onValueChange,
  placeholder = "Chọn...",
  label,
  disabled = false,
}: SelectProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        className={`border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between ${
          disabled ? "bg-gray-100" : "bg-white"
        }`}
      >
        <Text
          className={`flex-1 ${
            selectedOption ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {selectedOption ? (
            <View className="flex-row items-center gap-2">
              {selectedOption.icon && (
                <Text className="text-lg">{selectedOption.icon}</Text>
              )}
              <Text>{selectedOption.label}</Text>
            </View>
          ) : (
            placeholder
          )}
        </Text>
        <MaterialIcons
          name={modalVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={24}
          color="#6B7280"
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                {label || placeholder}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item, index) =>
                String(item.value) + index.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                  className={`py-4 px-4 border-b border-gray-100 flex-row items-center justify-between ${
                    value === item.value ? "bg-orange-50" : "bg-white"
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    {item.icon && <Text className="text-xl">{item.icon}</Text>}
                    <Text
                      className={`flex-1 ${
                        value === item.value
                          ? "text-orange-600 font-semibold"
                          : "text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {value === item.value && (
                    <MaterialIcons
                      name="check"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    padding: 20,
  },
});
