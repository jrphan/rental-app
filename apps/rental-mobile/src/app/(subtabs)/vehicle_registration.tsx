import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  color: string;
  engineCapacity: string;
  fuelType: string;
  transmission: string;
  mileage: string;
  price: string;
  description: string;
  address: string;
  images: string[];
  documents: {
    registration: string;
    insurance: string;
  };
}

export default function VehicleRegistrationScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageType, setImageType] = useState<
    "vehicle" | "registration" | "insurance"
  >("vehicle");

  const [formData, setFormData] = useState<VehicleFormData>({
    brand: "",
    model: "",
    year: "",
    licensePlate: "",
    color: "",
    engineCapacity: "",
    fuelType: "gasoline",
    transmission: "manual",
    mileage: "",
    price: "",
    description: "",
    address: "",
    images: [],
    documents: {
      registration: "",
      insurance: "",
    },
  });

  const handleBack = () => router.back();

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (
    type: "registration" | "insurance",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [type]: value },
    }));
  };

  const pickImage = async (type: "vehicle" | "registration" | "insurance") => {
    setImageType(type);
    setShowImagePicker(true);
  };

  const handleImagePicker = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Cần quyền truy cập",
        "Cần quyền truy cập thư viện ảnh để tải lên hình ảnh"
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

      if (imageType === "vehicle") {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, imageUri],
        }));
      } else {
        handleDocumentChange(imageType, imageUri);
      }
    }

    setShowImagePicker(false);
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeDocument = (type: "registration" | "insurance") => {
    handleDocumentChange(type, "");
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.brand ||
      !formData.model ||
      !formData.year ||
      !formData.licensePlate
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (formData.images.length === 0) {
      Alert.alert("Lỗi", "Vui lòng tải lên ít nhất một hình ảnh xe");
      return;
    }

    if (!formData.documents.registration || !formData.documents.insurance) {
      Alert.alert("Lỗi", "Vui lòng tải lên đầy đủ giấy tờ xe");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      Alert.alert(
        "Thành công",
        "Đăng ký xe thành công! Xe của bạn đang chờ duyệt từ quản trị viên.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi đăng ký xe. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {imageType === "vehicle"
                ? "Chọn hình ảnh xe"
                : imageType === "registration"
                ? "Chọn giấy đăng ký xe"
                : "Chọn giấy bảo hiểm xe"}
            </Text>
            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleImagePicker}
            >
              <Ionicons name="image" size={24} color="#007AFF" />
              <Text style={styles.modalButtonText}>Chọn từ thư viện</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký cho thuê xe</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hãng xe *</Text>
            <TextInput
              style={styles.input}
              value={formData.brand}
              onChangeText={(text) => handleInputChange("brand", text)}
              placeholder="Ví dụ: Honda, Yamaha, Suzuki"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mẫu xe *</Text>
            <TextInput
              style={styles.input}
              value={formData.model}
              onChangeText={(text) => handleInputChange("model", text)}
              placeholder="Ví dụ: Wave RSX, Exciter 155"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Năm sản xuất *</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => handleInputChange("year", text)}
                placeholder="2023"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Biển số *</Text>
              <TextInput
                style={styles.input}
                value={formData.licensePlate}
                onChangeText={(text) => handleInputChange("licensePlate", text)}
                placeholder="51A-12345"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Màu sắc</Text>
              <TextInput
                style={styles.input}
                value={formData.color}
                onChangeText={(text) => handleInputChange("color", text)}
                placeholder="Đỏ, Xanh, Đen..."
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Dung tích động cơ</Text>
              <TextInput
                style={styles.input}
                value={formData.engineCapacity}
                onChangeText={(text) =>
                  handleInputChange("engineCapacity", text)
                }
                placeholder="110cc, 150cc..."
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Technical Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Loại nhiên liệu</Text>
              <TextInput
                style={styles.input}
                value={formData.fuelType}
                onChangeText={(text) => handleInputChange("fuelType", text)}
                placeholder="Xăng, Điện..."
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Hộp số</Text>
              <TextInput
                style={styles.input}
                value={formData.transmission}
                onChangeText={(text) => handleInputChange("transmission", text)}
                placeholder="Số tay, Tự động..."
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số km đã đi</Text>
            <TextInput
              style={styles.input}
              value={formData.mileage}
              onChangeText={(text) => handleInputChange("mileage", text)}
              placeholder="10000 km"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giá cho thuê</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giá thuê/ngày (VNĐ) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => handleInputChange("price", text)}
              placeholder="150000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ xe *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => handleInputChange("address", text)}
              placeholder="Nhập địa chỉ chi tiết nơi đặt xe"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả xe</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              placeholder="Mô tả tình trạng xe, đặc điểm nổi bật..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh xe *</Text>
          <Text style={styles.sectionSubtitle}>
            Tải lên ít nhất 3 hình ảnh chất lượng cao
          </Text>

          <View style={styles.imageGrid}>
            {formData.images.map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {formData.images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => pickImage("vehicle")}
              >
                <Ionicons name="camera" size={24} color="#007AFF" />
                <Text style={styles.addImageText}>Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giấy tờ xe *</Text>

          <View style={styles.documentGroup}>
            <Text style={styles.label}>Giấy đăng ký xe</Text>
            {formData.documents.registration ? (
              <View style={styles.documentItem}>
                <Image
                  source={{ uri: formData.documents.registration }}
                  style={styles.documentImage}
                />
                <TouchableOpacity
                  style={styles.removeDocumentButton}
                  onPress={() => removeDocument("registration")}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addDocumentButton}
                onPress={() => pickImage("registration")}
              >
                <Ionicons name="document" size={24} color="#007AFF" />
                <Text style={styles.addDocumentText}>Tải lên giấy đăng ký</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.documentGroup}>
            <Text style={styles.label}>Giấy bảo hiểm xe</Text>
            {formData.documents.insurance ? (
              <View style={styles.documentItem}>
                <Image
                  source={{ uri: formData.documents.insurance }}
                  style={styles.documentImage}
                />
                <TouchableOpacity
                  style={styles.removeDocumentButton}
                  onPress={() => removeDocument("insurance")}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addDocumentButton}
                onPress={() => pickImage("insurance")}
              >
                <Ionicons name="document" size={24} color="#007AFF" />
                <Text style={styles.addDocumentText}>
                  Tải lên giấy bảo hiểm
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Đăng ký xe</Text>
            )}
          </TouchableOpacity>
        </View>
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
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageItem: {
    position: "relative",
    width: 80,
    height: 80,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
  },
  documentGroup: {
    marginBottom: 16,
  },
  documentItem: {
    position: "relative",
    width: 120,
    height: 80,
  },
  documentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeDocumentButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  addDocumentButton: {
    width: 120,
    height: 80,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addDocumentText: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 4,
    textAlign: "center",
  },
  submitContainer: {
    paddingVertical: 24,
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#007AFF",
    marginLeft: 12,
  },
});
