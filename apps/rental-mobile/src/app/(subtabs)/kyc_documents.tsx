import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useKycDocuments, useUploadKycDocument } from "../../queries/auth";
import * as ImagePicker from "expo-image-picker";
import type {
  KycDocumentType,
  UploadKycDocumentDto,
} from "@rental-app/shared-types";

const KYC_DOCUMENT_TYPES: {
  type: KycDocumentType;
  label: string;
  description: string;
}[] = [
  {
    type: "ID_CARD",
    label: "CCCD/CMND",
    description: "Căn cước công dân hoặc Chứng minh nhân dân",
  },
  {
    type: "DRIVER_LICENSE",
    label: "Bằng lái xe",
    description: "Giấy phép lái xe hợp lệ",
  },
  {
    type: "PASSPORT",
    label: "Hộ chiếu",
    description: "Hộ chiếu còn hiệu lực",
  },
];

export default function KycDocumentsScreen() {
  const router = useRouter();
  const { data: documents, isLoading } = useKycDocuments();
  const uploadDocumentMutation = useUploadKycDocument();

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedType, setSelectedType] = useState<KycDocumentType>("ID_CARD");
  const [frontImage, setFrontImage] = useState<string>("");
  const [backImage, setBackImage] = useState<string>("");

  const handleBack = () => router.back();

  const handleUploadDocument = (type: KycDocumentType) => {
    setSelectedType(type);
    setFrontImage("");
    setBackImage("");
    setShowImagePicker(true);
  };

  const pickImage = async (side: "front" | "back") => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Cần quyền truy cập",
        "Cần quyền truy cập thư viện ảnh để tải lên tài liệu"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      if (side === "front") {
        setFrontImage(imageUri);
      } else {
        setBackImage(imageUri);
      }
    }
  };

  const handleSubmitDocument = async () => {
    if (!frontImage) {
      Alert.alert("Lỗi", "Vui lòng tải lên ảnh mặt trước của tài liệu");
      return;
    }

    try {
      const uploadData: UploadKycDocumentDto = {
        type: selectedType,
        frontImage,
        backImage: backImage || undefined,
      };

      await uploadDocumentMutation.mutateAsync(uploadData);
      setShowImagePicker(false);
      setFrontImage("");
      setBackImage("");
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "#34C759";
      case "REJECTED":
        return "#FF3B30";
      case "PENDING":
      default:
        return "#FF9500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Đã duyệt";
      case "REJECTED":
        return "Bị từ chối";
      case "PENDING":
      default:
        return "Chờ duyệt";
    }
  };

  const getDocumentTypeLabel = (type: KycDocumentType) => {
    return KYC_DOCUMENT_TYPES.find((doc) => doc.type === type)?.label || type;
  };

  const renderDocumentItem = (document: any) => (
    <View key={document.id} style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentType}>
            {getDocumentTypeLabel(document.type)}
          </Text>
          <Text style={styles.documentDate}>
            {new Date(document.createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(document.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(document.status)}
          </Text>
        </View>
      </View>

      <View style={styles.documentImages}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: document.frontImage }}
            style={styles.documentImage}
          />
          <Text style={styles.imageLabel}>Mặt trước</Text>
        </View>
        {document.backImage && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: document.backImage }}
              style={styles.documentImage}
            />
            <Text style={styles.imageLabel}>Mặt sau</Text>
          </View>
        )}
      </View>

      {document.status === "REJECTED" && document.rejectedReason && (
        <View style={styles.rejectionReason}>
          <Text style={styles.rejectionTitle}>Lý do từ chối:</Text>
          <Text style={styles.rejectionText}>{document.rejectedReason}</Text>
        </View>
      )}
    </View>
  );

  const renderImagePicker = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Tải lên{" "}
              {
                KYC_DOCUMENT_TYPES.find((doc) => doc.type === selectedType)
                  ?.label
              }
            </Text>
            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              {
                KYC_DOCUMENT_TYPES.find((doc) => doc.type === selectedType)
                  ?.description
              }
            </Text>

            <View style={styles.imageUploadSection}>
              <Text style={styles.uploadLabel}>Ảnh mặt trước *</Text>
              {frontImage ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: frontImage }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setFrontImage("")}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage("front")}
                >
                  <Ionicons name="camera" size={32} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>
                    Chụp ảnh mặt trước
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.imageUploadSection}>
              <Text style={styles.uploadLabel}>Ảnh mặt sau (tùy chọn)</Text>
              {backImage ? (
                <View style={styles.imagePreview}>
                  <Image
                    source={{ uri: backImage }}
                    style={styles.previewImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setBackImage("")}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage("back")}
                >
                  <Ionicons name="camera" size={32} color="#007AFF" />
                  <Text style={styles.uploadButtonText}>Chụp ảnh mặt sau</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.uploadTips}>
              <Text style={styles.tipsTitle}>Lưu ý khi chụp ảnh:</Text>
              <Text style={styles.tipText}>
                • Đảm bảo ảnh rõ nét, không bị mờ
              </Text>
              <Text style={styles.tipText}>
                • Chụp đầy đủ thông tin trên tài liệu
              </Text>
              <Text style={styles.tipText}>• Tránh ánh sáng phản chiếu</Text>
              <Text style={styles.tipText}>
                • Không che khuất thông tin quan trọng
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !frontImage && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitDocument}
              disabled={!frontImage || uploadDocumentMutation.isPending}
            >
              {uploadDocumentMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Tải lên</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giấy phép lái xe</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài liệu xác minh danh tính</Text>
          <Text style={styles.sectionDescription}>
            Tải lên tài liệu để xác minh danh tính và tăng độ tin cậy cho tài
            khoản của bạn
          </Text>

          <View style={styles.documentTypes}>
            {KYC_DOCUMENT_TYPES.map((docType) => (
              <TouchableOpacity
                key={docType.type}
                style={styles.documentTypeCard}
                onPress={() => handleUploadDocument(docType.type)}
              >
                <View style={styles.documentTypeIcon}>
                  <Ionicons name="document-text" size={24} color="#007AFF" />
                </View>
                <View style={styles.documentTypeInfo}>
                  <Text style={styles.documentTypeLabel}>{docType.label}</Text>
                  <Text style={styles.documentTypeDescription}>
                    {docType.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {documents && documents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tài liệu đã tải lên</Text>
            {documents.map(renderDocumentItem)}
          </View>
        )}
      </ScrollView>

      {renderImagePicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  documentTypes: {
    gap: 12,
  },
  documentTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  documentTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentTypeInfo: {
    flex: 1,
  },
  documentTypeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  documentTypeDescription: {
    fontSize: 14,
    color: "#666",
  },
  documentCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  documentImages: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  imageContainer: {
    flex: 1,
  },
  documentImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  rejectionReason: {
    backgroundColor: "#fff5f5",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FF3B30",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 8,
  },
  imagePreview: {
    position: "relative",
    height: 120,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTips: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
