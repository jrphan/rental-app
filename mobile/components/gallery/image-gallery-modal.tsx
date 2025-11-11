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
  useWindowDimensions,
  StyleSheet,
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
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Fetch gallery query
  const galleryQuery = useQuery({
    queryKey: queryKeys.gallery.list(folder),
    queryFn: () => fileApi.getGallery(folder),
    enabled: visible,
  });

  const galleryFiles = galleryQuery.data;
  const isLoadingGallery = galleryQuery.isLoading;
  const { width: windowWidth } = useWindowDimensions();

  console.log(galleryFiles, "galleryFiles");

  const NUM_COLUMNS = 3;
  const ITEM_GAP = 8;
  const HORIZONTAL_PADDING = 16;
  const itemSize = Math.max(
    0,
    (windowWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * (NUM_COLUMNS - 1)) /
      NUM_COLUMNS
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (files: { uri: string; type: string; name: string }[]) =>
      fileApi.uploadFiles(files, folder),
    onSuccess: async () => {
      // Invalidate and refetch the gallery list for this folder
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gallery.list(folder),
      });
      await queryClient.refetchQueries({
        queryKey: queryKeys.gallery.list(folder),
        type: "active",
      });
      toast.showSuccess("Upload ảnh thành công");
    },
    onError: (error: any) => {
      toast.showError(error?.message || "Upload ảnh thất bại");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (keys: string[]) => fileApi.deleteFiles(keys),
    onSuccess: async () => {
      setSelectedKeys([]);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.gallery.list(folder),
      });
      await queryClient.refetchQueries({
        queryKey: queryKeys.gallery.list(folder),
        type: "active",
      });
      toast.showSuccess("Đã xoá ảnh đã chọn");
    },
    onError: (error: any) => {
      toast.showError(error?.message || "Xoá ảnh thất bại");
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
      mediaTypes: "images",
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
      mediaTypes: "images",
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
  const toggleSelection = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      if (!multiple && selectedKeys.length >= maxSelections) {
        if (maxSelections === 1) {
          setSelectedKeys([key]);
        } else {
          toast.showError(`Chỉ được chọn tối đa ${maxSelections} ảnh`);
        }
      } else {
        setSelectedKeys([...selectedKeys, key]);
      }
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedKeys.length === 0) {
      toast.showError("Vui lòng chọn ít nhất một ảnh");
      return;
    }
    const urls =
      galleryFiles
        ?.filter((f) => selectedKeys.includes(f.key))
        .map((f) => f.url) || [];
    onSelect(urls);
    setSelectedKeys([]);
    onClose();
  };

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedKeys([]);
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
            disabled={selectedKeys.length === 0}
          >
            <Text
              className={`text-lg font-semibold ${
                selectedKeys.length === 0 ? "text-gray-400" : "text-blue-600"
              }`}
            >
              Chọn ({selectedKeys.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="px-4 py-3 border-b border-gray-200">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={pickImages}
              className={`flex-1 flex-row items-center justify-center rounded-lg py-3 px-4 ${
                uploadMutation.isPending
                  ? "opacity-60 bg-blue-600"
                  : "bg-blue-600"
              }`}
              disabled={uploadMutation.isPending}
            >
              <MaterialIcons name="photo-library" size={20} color="#fff" />
              <Text className="ml-2 text-white font-medium">
                Chọn từ thư viện
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              className={`flex-1 flex-row items-center justify-center rounded-lg py-3 px-4 ${
                uploadMutation.isPending
                  ? "opacity-60 bg-green-600"
                  : "bg-green-600"
              }`}
              disabled={uploadMutation.isPending}
            >
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
              <Text className="ml-2 text-white font-medium">Chụp ảnh</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-end gap-3 mt-3">
            <TouchableOpacity
              onPress={() => deleteMutation.mutate(selectedKeys)}
              className="flex-row items-center justify-center rounded-full px-3 py-1 border bg-white border-gray-300"
              disabled={deleteMutation.isPending || selectedKeys.length === 0}
            >
              <MaterialIcons name="delete-forever" size={18} color="#111827" />
              <Text className="ml-1 text-gray-800 text-sm">Xoá đã chọn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!galleryFiles || galleryFiles.length === 0) return;
                setSelectedKeys(galleryFiles.map((f) => f.key));
              }}
              className="flex-row items-center justify-center rounded-full px-3 py-1 border bg-white border-gray-300"
              disabled={!galleryFiles || galleryFiles.length === 0}
            >
              <MaterialIcons name="select-all" size={18} color="#111827" />
              <Text className="ml-1 text-gray-800 text-sm">Chọn tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedKeys([])}
              className={`flex-row items-center justify-center rounded-full px-3 py-1 border bg-white border-gray-300 ${
                selectedKeys.length === 0 ? "opacity-60" : ""
              }`}
              disabled={selectedKeys.length === 0}
            >
              <MaterialIcons name="close" size={18} color="#111827" />
              <Text className="ml-1 text-gray-800 text-sm">Bỏ chọn</Text>
            </TouchableOpacity>
          </View>
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
            numColumns={NUM_COLUMNS}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingHorizontal: HORIZONTAL_PADDING,
              paddingVertical: ITEM_GAP,
            }}
            extraData={selectedKeys}
            renderItem={({ item, index }) => {
              const isSelected = selectedKeys.includes(item.key);
              const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
              return (
                <TouchableOpacity
                  onPress={() => toggleSelection(item.key)}
                  style={[
                    styles.imageItem,
                    {
                      width: itemSize,
                      height: itemSize,
                      marginRight: isLastInRow ? 0 : ITEM_GAP,
                      marginBottom: ITEM_GAP,
                      borderColor: isSelected ? "#2563EB" : "#E5E7EB",
                    },
                  ]}
                >
                  <Image source={{ uri: item.url }} style={styles.image} />
                  {isSelected ? (
                    <>
                      <View style={styles.selectedOverlay} />
                      <View style={styles.checkBadge}>
                        <MaterialIcons name="check" size={18} color="#fff" />
                      </View>
                    </>
                  ) : null}
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

const styles = StyleSheet.create({
  imageItem: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(37, 99, 235, 0.18)",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2563EB",
    borderRadius: 999,
    padding: 4,
  },
});
