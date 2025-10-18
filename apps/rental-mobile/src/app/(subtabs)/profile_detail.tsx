import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateProfile } from "../../queries/auth";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from "../../schemas/profile";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
    mode: "onChange",
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user, reset]);

  const canSave = isEditing && isValid;

  const handleBack = () => router.back();

  const handleCancel = () => {
    // Reset form to original values
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    });
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handlePrimary = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    // Trigger form submission
    handleSubmit(onSubmit)();
  };

  const onSubmit: SubmitHandler<ProfileUpdateFormData> = async (data) => {
    try {
      await updateMutation.mutateAsync({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
      });
      setIsEditing(false);
      Keyboard.dismiss();
    } catch (e) {
      // Toast handled in hook
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              </View>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            {/* Editable Information Card */}
            <View style={styles.editableCard}>
              <Text style={styles.cardTitle}>Thông tin cá nhân</Text>

              {/* First Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Tên *</Text>
                {isEditing ? (
                  <View style={styles.inputWrapper}>
                    <Controller
                      control={control}
                      name="firstName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Nhập tên"
                          placeholderTextColor="#9E9E9E"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          editable={!updateMutation.isPending}
                        />
                      )}
                    />
                    {errors.firstName && (
                      <Text style={styles.fieldError}>
                        {errors.firstName.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{user?.firstName}</Text>
                )}
              </View>

              {/* Last Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Họ *</Text>
                {isEditing ? (
                  <View style={styles.inputWrapper}>
                    <Controller
                      control={control}
                      name="lastName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Nhập họ"
                          placeholderTextColor="#9E9E9E"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          editable={!updateMutation.isPending}
                        />
                      )}
                    />
                    {errors.lastName && (
                      <Text style={styles.fieldError}>
                        {errors.lastName.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{user?.lastName}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email *</Text>
                {isEditing ? (
                  <View style={styles.inputWrapper}>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Nhập email"
                          placeholderTextColor="#9E9E9E"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          editable={!updateMutation.isPending}
                        />
                      )}
                    />
                    {errors.email && (
                      <Text style={styles.fieldError}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>{user?.email}</Text>
                )}
              </View>

              {/* Phone */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                {isEditing ? (
                  <View style={styles.inputWrapper}>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          style={styles.fieldInput}
                          placeholder="Nhập số điện thoại"
                          placeholderTextColor="#9E9E9E"
                          keyboardType="phone-pad"
                          value={value ?? ""}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          editable={!updateMutation.isPending}
                        />
                      )}
                    />
                    {errors.phone && (
                      <Text style={styles.fieldError}>
                        {errors.phone.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.fieldValue}>
                    {user?.phone || "Chưa cập nhật"}
                  </Text>
                )}
              </View>
            </View>

            {/* Read-only Information Card */}
            <View style={styles.readOnlyCard}>
              <Text style={styles.cardTitle}>Thông tin tài khoản</Text>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Vai trò</Text>
                <Text style={styles.fieldValue}>
                  {user?.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                </Text>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Ngày tạo</Text>
                <Text style={styles.fieldValue}>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                    : "N/A"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isEditing ? styles.saveButtonColor : styles.editButtonColor,
                !canSave && isEditing && styles.disabledButton,
                updateMutation.isPending && styles.disabledButton,
              ]}
              onPress={handlePrimary}
              disabled={(isEditing && !canSave) || updateMutation.isPending}
            >
              <Text style={styles.primaryButtonText}>
                {updateMutation.isPending
                  ? "Đang lưu..."
                  : isEditing
                  ? "Lưu"
                  : "Chỉnh sửa"}
              </Text>
            </TouchableOpacity>

            {/* Cancel button - only show when editing */}
            {isEditing && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  updateMutation.isPending && styles.disabledButton,
                ]}
                onPress={handleCancel}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    height: 56,
    // backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 12,
    // borderRadius: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerTitle: { color: "#000", fontSize: 20, fontWeight: "700" },
  // Profile Header
  profileHeader: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },

  // Cards
  editableCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  readOnlyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },

  // Field Layout
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#666",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputWrapper: {
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  fieldError: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editButtonColor: {
    backgroundColor: COLORS.primary,
  },
  saveButtonColor: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    // backgroundColor: "#bdc3c7",
    opacity: 0.5,
  },
});
