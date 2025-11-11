import { useState, useEffect } from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fileApi } from "@/lib/api.file";
import { useToast } from "@/lib/toast";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { queryKeys } from "@/lib/queryClient";

interface ImageGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  maxSelections?: number;
}

export function ImageGalleryModal({
  visible,
  onClose,
  onSelect,
  folder = "images",
  multiple = false,
  maxSelections = 1,
}: ImageGalleryModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  // Fetch gallery query
  const galleryQuery = useQuery({
    queryKey: queryKeys.gallery.list(folder),
    queryFn: () => fileApi.getGallery(folder),
    enabled: visible,
  });

  const galleryFiles = galleryQuery.data;
  const isLoadingGallery = galleryQuery.isLoading;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (files: { uri: string; type: string; name: string }[]) =>
      fileApi.uploadFiles(files, folder),
    onSuccess: async () => {
      // Refetch gallery data immediately after upload
      await queryClient.refetchQueries({
        queryKey: queryKeys.gallery.list(folder),
      });
      toast.showSuccess("Upload ảnh thành công");
    },
    onError: (error: any) => {
      toast.showError(error?.message || "Upload ảnh thất bại");
    },
  });

  // Pick images from device
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Cần quyền truy cập thư viện ảnh để chọn hình ảnh"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Always allow multiple selection for upload
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const files = result.assets.map((asset, index) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
      }));

      uploadMutation.mutate(files);
    }
  };

  // Take photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền truy cập", "Cần quyền truy cập camera để chụp ảnh");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = {
        uri: result.assets[0].uri,
        type: result.assets[0].mimeType || "image/jpeg",
        name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
      };

      uploadMutation.mutate([file]);
    }
  };

  // Handle image selection
  const toggleSelection = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls(selectedUrls.filter((u) => u !== url));
    } else {
      if (!multiple && selectedUrls.length >= maxSelections) {
        if (maxSelections === 1) {
          setSelectedUrls([url]);
        } else {
          toast.showError(`Chỉ được chọn tối đa ${maxSelections} ảnh`);
        }
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedUrls.length === 0) {
      toast.showError("Vui lòng chọn ít nhất một ảnh");
      return;
    }
    onSelect(selectedUrls);
    setSelectedUrls([]);
    onClose();
  };

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedUrls([]);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            Thư viện ảnh
          </Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selectedUrls.length === 0}
          >
            <Text
              className={`text-lg font-semibold ${
                selectedUrls.length === 0 ? "text-gray-400" : "text-blue-600"
              }`}
            >
              Chọn ({selectedUrls.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="flex-row px-4 py-3 border-b border-gray-200 gap-3">
          <TouchableOpacity
            onPress={pickImages}
            className="flex-1 flex-row items-center justify-center bg-blue-600 rounded-lg py-3 px-4"
            disabled={uploadMutation.isPending}
          >
            <MaterialIcons name="photo-library" size={20} color="#fff" />
            <Text className="ml-2 text-white font-medium">
              Chọn từ thư viện
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={takePhoto}
            className="flex-1 flex-row items-center justify-center bg-green-600 rounded-lg py-3 px-4"
            disabled={uploadMutation.isPending}
          >
            <MaterialIcons name="camera-alt" size={20} color="#fff" />
            <Text className="ml-2 text-white font-medium">Chụp ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* Gallery */}
        {isLoadingGallery || uploadMutation.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4 text-gray-600">Đang tải...</Text>
          </View>
        ) : galleryFiles && galleryFiles.length > 0 ? (
          <FlatList
            data={galleryFiles}
            numColumns={3}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ padding: 2 }}
            renderItem={({ item }) => {
              const isSelected = selectedUrls.includes(item.url);
              return (
                <TouchableOpacity
                  onPress={() => toggleSelection(item.url)}
                  className={`m-1 w-1/3 aspect-square rounded-lg overflow-hidden border-2 ${
                    isSelected ? "border-blue-600" : "border-gray-200"
                  }`}
                >
                  <Image
                    source={{ uri: item.url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  {isSelected && (
                    <View className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                      <MaterialIcons name="check" size={16} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <MaterialIcons name="image" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-gray-500 text-center">
              Chưa có ảnh nào. Hãy tải lên ảnh đầu tiên!
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
