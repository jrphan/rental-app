import { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { ImageGalleryModal } from "./image-gallery-modal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface GalleryButtonProps {
  onSelect: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  maxSelections?: number;
  label?: string;
  variant?: "default" | "outline";
}

export function GalleryButton({
  onSelect,
  folder = "images",
  multiple = false,
  maxSelections = 1,
  label = "Chọn từ thư viện",
  variant = "default",
}: GalleryButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className={`flex-row items-center justify-center px-4 py-3 rounded-lg ${
          variant === "outline"
            ? "bg-white border border-gray-300"
            : "bg-blue-600"
        }`}
      >
        <MaterialIcons
          name="photo-library"
          size={20}
          color={variant === "outline" ? "#374151" : "#fff"}
        />
        <Text
          className={`ml-2 font-medium ${
            variant === "outline" ? "text-gray-700" : "text-white"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>

      <ImageGalleryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={onSelect}
        folder={folder}
        multiple={multiple}
        maxSelections={maxSelections}
      />
    </>
  );
}
