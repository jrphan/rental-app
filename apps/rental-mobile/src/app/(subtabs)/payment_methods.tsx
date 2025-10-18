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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from "../../queries/auth";
import type {
  PaymentMethod,
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodType,
} from "@rental-app/shared-types";

const PAYMENT_METHOD_TYPES: {
  type: PaymentMethodType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    type: "CREDIT_CARD",
    label: "Thẻ tín dụng",
    icon: "card",
    description: "Visa, Mastercard, JCB",
  },
  {
    type: "DEBIT_CARD",
    label: "Thẻ ghi nợ",
    icon: "card",
    description: "Thẻ ATM nội địa",
  },
  {
    type: "E_WALLET",
    label: "Ví điện tử",
    icon: "wallet",
    description: "Momo, ZaloPay, VNPay",
  },
  {
    type: "BANK_TRANSFER",
    label: "Chuyển khoản ngân hàng",
    icon: "business",
    description: "Chuyển khoản trực tiếp",
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { data: paymentMethods, isLoading } = usePaymentMethods();
  const createPaymentMethodMutation = useCreatePaymentMethod();
  const updatePaymentMethodMutation = useUpdatePaymentMethod();
  const deletePaymentMethodMutation = useDeletePaymentMethod();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [selectedType, setSelectedType] =
    useState<PaymentMethodType>("CREDIT_CARD");
  const [formData, setFormData] = useState<CreatePaymentMethodDto>({
    type: "CREDIT_CARD",
    provider: "",
    providerId: "",
    last4: "",
    brand: "",
    expiryMonth: undefined,
    expiryYear: undefined,
    isDefault: false,
  });

  const handleBack = () => router.back();

  const handleAddPaymentMethod = () => {
    setFormData({
      type: "CREDIT_CARD",
      provider: "",
      providerId: "",
      last4: "",
      brand: "",
      expiryMonth: undefined,
      expiryYear: undefined,
      isDefault: false,
    });
    setSelectedType("CREDIT_CARD");
    setShowAddModal(true);
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      type: paymentMethod.type,
      provider: paymentMethod.provider,
      providerId: paymentMethod.providerId,
      last4: paymentMethod.last4 || "",
      brand: paymentMethod.brand || "",
      expiryMonth: paymentMethod.expiryMonth || undefined,
      expiryYear: paymentMethod.expiryYear || undefined,
      isDefault: paymentMethod.isDefault,
    });
    setSelectedType(paymentMethod.type);
    setShowEditModal(true);
  };

  const handleDeletePaymentMethod = (paymentMethod: PaymentMethod) => {
    Alert.alert(
      "Xóa phương thức thanh toán",
      `Bạn có chắc chắn muốn xóa ${getPaymentMethodLabel(
        paymentMethod.type
      )} này?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => deletePaymentMethodMutation.mutate(paymentMethod.id),
        },
      ]
    );
  };

  const handleSetDefault = (paymentMethod: PaymentMethod) => {
    updatePaymentMethodMutation.mutate({
      paymentMethodId: paymentMethod.id,
      data: { isDefault: true },
    });
  };

  const getPaymentMethodLabel = (type: PaymentMethodType) => {
    return PAYMENT_METHOD_TYPES.find((pm) => pm.type === type)?.label || type;
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    return PAYMENT_METHOD_TYPES.find((pm) => pm.type === type)?.icon || "card";
  };

  const handleSubmit = async () => {
    if (!formData.provider || !formData.providerId) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethodMutation.mutateAsync({
          paymentMethodId: editingPaymentMethod.id,
          data: formData as UpdatePaymentMethodDto,
        });
        setShowEditModal(false);
        setEditingPaymentMethod(null);
      } else {
        await createPaymentMethodMutation.mutateAsync(formData);
        setShowAddModal(false);
      }
      setFormData({
        type: "CREDIT_CARD",
        provider: "",
        providerId: "",
        last4: "",
        brand: "",
        expiryMonth: undefined,
        expiryYear: undefined,
        isDefault: false,
      });
    } catch (error) {
      console.error("Error saving payment method:", error);
    }
  };

  const renderPaymentMethodItem = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.paymentMethodCard}>
      <View style={styles.paymentMethodInfo}>
        <View style={styles.paymentMethodHeader}>
          <View style={styles.paymentMethodIcon}>
            <Ionicons
              name={getPaymentMethodIcon(item.type) as any}
              size={24}
              color="#007AFF"
            />
          </View>
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodType}>
              {getPaymentMethodLabel(item.type)}
            </Text>
            <Text style={styles.paymentMethodProvider}>{item.provider}</Text>
            {item.last4 && (
              <Text style={styles.paymentMethodLast4}>
                **** **** **** {item.last4}
              </Text>
            )}
            {item.brand && (
              <Text style={styles.paymentMethodBrand}>{item.brand}</Text>
            )}
            {item.expiryMonth && item.expiryYear && (
              <Text style={styles.paymentMethodExpiry}>
                Hết hạn: {item.expiryMonth.toString().padStart(2, "0")}/
                {item.expiryYear}
              </Text>
            )}
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.paymentMethodActions}>
        {!item.isDefault && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item)}
          >
            <Ionicons name="star" size={20} color="#FFD700" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditPaymentMethod(item)}
        >
          <Ionicons name="pencil" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePaymentMethod(item)}
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
          setEditingPaymentMethod(null);
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
                  setEditingPaymentMethod(null);
                } else {
                  setShowAddModal(false);
                }
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEdit
                ? "Chỉnh sửa phương thức thanh toán"
                : "Thêm phương thức thanh toán"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại phương thức *</Text>
                <View style={styles.typeSelector}>
                  {PAYMENT_METHOD_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.type}
                      style={[
                        styles.typeOption,
                        selectedType === type.type && styles.typeOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedType(type.type);
                        setFormData({ ...formData, type: type.type });
                      }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={selectedType === type.type ? "#007AFF" : "#666"}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          selectedType === type.type &&
                            styles.typeOptionTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nhà cung cấp *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.provider}
                  onChangeText={(text) =>
                    setFormData({ ...formData, provider: text })
                  }
                  placeholder="Ví dụ: Stripe, Momo, VNPay"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ID nhà cung cấp *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.providerId}
                  onChangeText={(text) =>
                    setFormData({ ...formData, providerId: text })
                  }
                  placeholder="ID từ nhà cung cấp"
                  placeholderTextColor="#999"
                />
              </View>

              {(selectedType === "CREDIT_CARD" ||
                selectedType === "DEBIT_CARD") && (
                <>
                  <View style={styles.row}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.label}>4 số cuối</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.last4}
                        onChangeText={(text) =>
                          setFormData({ ...formData, last4: text })
                        }
                        placeholder="1234"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.label}>Thương hiệu</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.brand}
                        onChangeText={(text) =>
                          setFormData({ ...formData, brand: text })
                        }
                        placeholder="Visa, Mastercard"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}
                    >
                      <Text style={styles.label}>Tháng hết hạn</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.expiryMonth?.toString() || ""}
                        onChangeText={(text) =>
                          setFormData({
                            ...formData,
                            expiryMonth: text ? parseInt(text) : undefined,
                          })
                        }
                        placeholder="12"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View
                      style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}
                    >
                      <Text style={styles.label}>Năm hết hạn</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.expiryYear?.toString() || ""}
                        onChangeText={(text) =>
                          setFormData({
                            ...formData,
                            expiryYear: text ? parseInt(text) : undefined,
                          })
                        }
                        placeholder="2025"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>
                </>
              )}

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
                <Text style={styles.checkboxLabel}>
                  Đặt làm phương thức mặc định
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setEditingPaymentMethod(null);
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
                createPaymentMethodMutation.isPending ||
                updatePaymentMethodMutation.isPending
              }
            >
              {createPaymentMethodMutation.isPending ||
              updatePaymentMethodMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
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
        <Text style={styles.headerTitle}>Thẻ thanh toán</Text>
        <TouchableOpacity
          onPress={handleAddPaymentMethod}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {paymentMethods && paymentMethods.length > 0 ? (
        <FlatList
          data={paymentMethods}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentMethodItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            Chưa có phương thức thanh toán nào
          </Text>
          <Text style={styles.emptySubtitle}>
            Thêm phương thức thanh toán để thuận tiện cho việc đặt xe
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={handleAddPaymentMethod}
          >
            <Text style={styles.addFirstButtonText}>
              Thêm phương thức đầu tiên
            </Text>
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
  paymentMethodCard: {
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
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  paymentMethodProvider: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  paymentMethodLast4: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  paymentMethodBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  paymentMethodExpiry: {
    fontSize: 14,
    color: "#666",
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
  paymentMethodActions: {
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
  modalBody: {
    padding: 16,
  },
  form: {
    gap: 16,
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
  row: {
    flexDirection: "row",
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  typeOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  typeOptionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  typeOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "500",
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
    paddingHorizontal: 16,
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
