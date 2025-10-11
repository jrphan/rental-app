import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, StatusBar, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useUpdateProfile } from "../../queries/auth";
import { useRouter } from "expo-router";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateMutation = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const canSave = useMemo(() => {
    if (!isEditing) return false;
    const nameOk = firstName.trim().length > 0 && lastName.trim().length > 0;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const phoneOk = phone ? /^\d{9,11}$/.test(phone.replace(/\D/g, "")) : true;
    return nameOk && emailOk && phoneOk;
  }, [isEditing, firstName, lastName, email, phone]);

  const handleBack = () => router.back();

  const handleCancel = () => {
    // Reset form to original values
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handlePrimary = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!canSave) {
      Alert.alert("Không hợp lệ", "Vui lòng kiểm tra lại thông tin.");
      return;
    }

    try {
      await updateMutation.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone?.trim() || undefined });
      setIsEditing(false);
      Keyboard.dismiss();
    } catch (e) {
      // Toast handled in hook
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Status Bar - Dark content on light background */}
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user
                ? `${user.firstName} ${user.lastName}`.charAt(0).toUpperCase()
                : "U"}
            </Text>
          </View>

          <Text style={styles.name}>
            {user ? `${user.firstName} ${user.lastName}` : "User"}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tên:</Text>
            {isEditing ? (
              <View style={styles.inputsInline}>
                <TextInput
                  style={styles.input}
                  placeholder="Họ"
                  placeholderTextColor="#9E9E9E"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!updateMutation.isPending}
                />
                <TextInput
                  style={[styles.input, { marginLeft: 8 }]}
                  placeholder="Tên"
                  placeholderTextColor="#9E9E9E"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!updateMutation.isPending}
                />
              </View>
            ) : (
              <Text style={styles.infoValue}>{user ? `${user.firstName} ${user.lastName}` : "User"}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9E9E9E"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!updateMutation.isPending}
              />
            ) : (
              <Text style={styles.infoValue}>{user?.email}</Text>
            )}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại:</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
                value={phone ?? ''}
                onChangeText={setPhone}
                editable={!updateMutation.isPending}
              />
            ) : (
              <Text style={styles.infoValue}>{user?.phone}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vai trò:</Text>
            <Text style={styles.infoValue}>
              {user?.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tạo:</Text>
            <Text style={styles.infoValue}>
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
            (!canSave && isEditing) && styles.disabledButton,
            updateMutation.isPending && styles.disabledButton,
          ]}
          onPress={handlePrimary}
          disabled={(isEditing && !canSave) || updateMutation.isPending}
        >
          <Text style={styles.primaryButtonText}>
            {updateMutation.isPending ? "Đang lưu..." : isEditing ? "Lưu" : "Chỉnh sửa"}
          </Text>
        </TouchableOpacity>

        {/* Cancel button - only show when editing */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.cancelButton, updateMutation.isPending && styles.disabledButton]}
            onPress={handleCancel}
            disabled={updateMutation.isPending}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#f8f9fa",
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
  profileCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  infoSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  infoValue: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  input: {
    minWidth: 150,
    borderWidth: 1,
    borderColor: "#ecf0f1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputsInline: { flexDirection: "row", alignItems: "center" },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  editButtonColor: {
    backgroundColor: "#3498db",
  },
  saveButtonColor: {
    backgroundColor: COLORS.lanternGreen,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: COLORS.lanternRed,
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
