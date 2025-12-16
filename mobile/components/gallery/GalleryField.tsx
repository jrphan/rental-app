import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  useUploadUserFile,
  useDeleteUserFile,
  useUserFiles,
} from "@/hooks/files/useUserFiles";
import { UserFile } from "@/types/file.types";

interface GalleryFieldProps {
  label: string;
  folder?: string;
  multiple?: boolean;
  value: string | string[] | null | undefined;
  onChange: (value: string | string[] | null) => void;
  error?: string;
}

export default function GalleryField({
  label,
  folder = "images",
  multiple = false,
  value,
  onChange,
  error,
}: GalleryFieldProps) {
  const [isPicking, setIsPicking] = useState(false);
  const uploadMutation = useUploadUserFile(folder);
  const deleteMutation = useDeleteUserFile(folder);
  const { data: files } = useUserFiles(folder);

  const currentUrls: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const handlePickImage = async () => {
    try {
      setIsPicking(true);
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsMultipleSelection: multiple,
        quality: 0.8,
      });
      if (result.canceled) return;

      const assets = result.assets ?? [];
      if (assets.length === 0) return;

      if (multiple) {
        const uploads = assets.map((asset) =>
          uploadMutation.mutateAsync({
            uri: asset.uri,
            name: asset.fileName || "image.jpg",
            type: asset.mimeType || "image/jpeg",
          })
        );
        const uploaded = await Promise.all(uploads);
        const urls = uploaded.map((u) => u.url);
        onChange([...currentUrls, ...urls]);
      } else {
        const asset = assets[0];
        const uploaded = await uploadMutation.mutateAsync({
          uri: asset.uri,
          name: asset.fileName || "image.jpg",
          type: asset.mimeType || "image/jpeg",
        });
        onChange(uploaded.url);
      }
    } finally {
      setIsPicking(false);
    }
  };

  const handleRemoveUrl = async (url: string) => {
    // Nếu file đang nằm trong danh sách files đã load, cố gắng xóa luôn ở server
    const file: UserFile | undefined = files?.find((f) => f.url === url);
    if (file && !deleteMutation.isPending) {
      await deleteMutation.mutateAsync(file.id);
    }
    if (multiple) {
      onChange(currentUrls.filter((u) => u !== url));
    } else {
      onChange(null);
    }
  };

  return (
    <View className="mt-4">
      <Text className="mb-2 text-sm font-medium text-gray-700">{label}</Text>

      <View className="flex-row flex-wrap gap-3">
        {currentUrls.map((url) => (
          <View key={url} className="relative">
            <Image
              source={{ uri: url }}
              style={{ width: 72, height: 72, borderRadius: 12 }}
            />
            <TouchableOpacity
              onPress={() => handleRemoveUrl(url)}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/70 items-center justify-center"
            >
              <MaterialIcons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={handlePickImage}
          disabled={uploadMutation.isPending || isPicking}
          className="h-18 w-18 rounded-2xl border border-dashed border-gray-300 items-center justify-center bg-gray-50"
          style={{ width: 72, height: 72 }}
        >
          {uploadMutation.isPending || isPicking ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <MaterialIcons name="add-a-photo" size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
}
