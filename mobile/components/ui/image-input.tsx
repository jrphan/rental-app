import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { GalleryButton } from "@/components/gallery/gallery-button";

interface ImageInputProps {
  label?: string;
  value?: string | string[]; // single or multiple URLs
  onChange: (value: string | string[]) => void;
  error?: string;
  folder?: string;
  multiple?: boolean;
  maxSelections?: number;
  editable?: boolean;
}

export function ImageInput({
  label,
  value,
  onChange,
  error,
  folder = "images",
  multiple = false,
  maxSelections = 5,
  editable = true,
}: ImageInputProps) {
  const valuesArray = React.useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );

  const handleSelectFromGallery = (urls: string[]) => {
    if (!editable) return;
    if (multiple) {
      onChange(urls);
    } else {
      onChange(urls[0] ?? "");
    }
  };

  const handleRemoveAt = (index: number) => {
    if (!editable) return;
    if (multiple) {
      const next = valuesArray.filter((_, i) => i !== index);
      onChange(next);
    } else {
      onChange("");
    }
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-2 text-sm font-semibold text-gray-900">
          {label}
        </Text>
      )}

      {valuesArray.length === 0 ? (
        <View className="w-full h-48 rounded-xl border border-dashed border-gray-300 items-center justify-center bg-gray-50 mb-3">
          <Text className="text-sm text-gray-500">Chưa chọn hình ảnh</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap -mx-1 mb-3">
          {valuesArray.map((uri, index) => (
            <View key={uri + index} className="w-1/3 px-1 mb-2">
              <View className="rounded-xl overflow-hidden border border-gray-200">
                <Image
                  source={{ uri }}
                  className="w-full aspect-[3/4]"
                  resizeMode="cover"
                />
                {editable && (
                  <TouchableOpacity
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 items-center justify-center"
                    onPress={() => handleRemoveAt(index)}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {error && (
        <Text className="mb-2 text-xs text-red-500">
          {error}
        </Text>
      )}

      {editable && (
        <GalleryButton
          onSelect={handleSelectFromGallery}
          folder={folder}
          multiple={multiple}
          maxSelections={maxSelections}
          label={multiple ? "Thêm hình ảnh" : "Chọn hình ảnh"}
          variant="outline"
        />
      )}
    </View>
  );
}


