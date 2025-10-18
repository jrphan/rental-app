import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useUserAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "../../queries/auth";
import type {
  UserAddress,
  CreateAddressDto,
  UpdateAddressDto,
} from "@rental-app/shared-types";

export default function AddressesScreen() {
  const router = useRouter();
  const { data: addresses, isLoading } = useUserAddresses();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null
  );
  const [formData, setFormData] = useState<CreateAddressDto>({
    title: "",
    fullAddress: "",
    latitude: undefined,
    longitude: undefined,
    isDefault: false,
  });

  const handleBack = () => router.back();

  const handleAddAddress = () => {
    setFormData({
      title: "",
      fullAddress: "",
      latitude: undefined,
      longitude: undefined,
      isDefault: false,
    });
    setShowAddModal(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setFormData({
      title: address.title,
      fullAddress: address.fullAddress,
      latitude: address.latitude || undefined,
      longitude: address.longitude || undefined,
      isDefault: address.isDefault,
    });
    setShowEditModal(true);
  };

  const handleDeleteAddress = (address: UserAddress) => {
    Alert.alert(
      "Xóa địa chỉ",
      `Bạn có chắc chắn muốn xóa địa chỉ "${address.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deleteAddressMutation.mutate(address.id),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.fullAddress.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddress.id,
          data: formData as UpdateAddressDto,
        });
        setShowEditModal(false);
        setEditingAddress(null);
      } else {
        await createAddressMutation.mutateAsync(formData);
        setShowAddModal(false);
      }
      setFormData({
        title: "",
        fullAddress: "",
        latitude: undefined,
        longitude: undefined,
        isDefault: false,
      });
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const renderAddressItem = ({ item }: { item: UserAddress }) => (
    <View style={styles.addressItem}>
      <View style={styles.addressInfo}>
        <View style={styles.addressHeader}>
          <Text style={styles.addressTitle}>{item.title}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressText}>{item.fullAddress}</Text>
        {item.latitude && item.longitude && (
          <Text style={styles.coordinatesText}>
            Tọa độ: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
          </Text>
        )}
      </View>
      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditAddress(item)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteAddress(item)}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setEditingAddress(null);
        } else {
          setShowAddModal(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setEditingAddress(null);
                } else {
                  setShowAddModal(false);
                }
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên địa chỉ *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) =>
                  setFormData({ ...formData, title: text })
                }
                placeholder="Ví dụ: Nhà, Công ty, Địa chỉ giao hàng"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ đầy đủ *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.fullAddress}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullAddress: text })
                }
                placeholder="Nhập địa chỉ chi tiết"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tọa độ (tùy chọn)</Text>
              <View style={styles.coordinateInputs}>
                <TextInput
                  style={[styles.input, styles.coordinateInput]}
                  value={formData.latitude?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      latitude: text ? parseFloat(text) : undefined,
                    })
                  }
                  placeholder="Vĩ độ"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.coordinateInput]}
                  value={formData.longitude?.toString() || ""}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      longitude: text ? parseFloat(text) : undefined,
                    })
                  }
                  placeholder="Kinh độ"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                setFormData({ ...formData, isDefault: !formData.isDefault })
              }
            >
              <View style={styles.checkbox}>
                {formData.isDefault && (
                  <Ionicons name="checkmark" size={16} color="#007AFF" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  if (isEdit) {
                    setShowEditModal(false);
                    setEditingAddress(null);
                  } else {
                    setShowAddModal(false);
                  }
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={
                  createAddressMutation.isPending ||
                  updateAddressMutation.isPending
                }
              >
                {createAddressMutation.isPending ||
                updateAddressMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
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
        <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
        <TouchableOpacity onPress={handleAddAddress} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {addresses && addresses.length > 0 ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
          <Text style={styles.emptySubtitle}>
            Thêm địa chỉ để thuận tiện cho việc giao hàng
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={handleAddAddress}
          >
            <Text style={styles.addFirstButtonText}>Thêm địa chỉ đầu tiên</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderModal(false)}
      {renderModal(true)}
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
  addButton: {
    padding: 8,
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
  listContainer: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: "#999",
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  form: {
    padding: 16,
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
  coordinateInputs: {
    flexDirection: "row",
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
