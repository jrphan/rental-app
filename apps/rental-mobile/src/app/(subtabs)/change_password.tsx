import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useChangePassword } from "@/queries";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const changePasswordMutation = useChangePassword();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [secure, setSecure] = useState({ old: true, next: true, confirm: true });

    const validationError = useMemo(() => {
        if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            return "Vui lòng nhập đầy đủ thông tin";
        }
        if (newPassword.length < 6) return "Mật khẩu mới phải có ít nhất 6 ký tự";
        if (newPassword !== confirmPassword) return "Xác nhận mật khẩu không khớp";
        if (oldPassword === newPassword) return "Mật khẩu mới không được trùng mật khẩu cũ";
        return null;
    }, [oldPassword, newPassword, confirmPassword]);

    const handleSubmit = async () => {
        Keyboard.dismiss();
        if (validationError) {
            Toast.show({ type: "error", text1: "Không hợp lệ", text2: validationError });
            return;
        }
        try {
            await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
            // setOldPassword("");
            // setNewPassword("");
            // setConfirmPassword("");
            router.back();
        } catch (e) { }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Thiết lập mật khẩu</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Mật khẩu cũ"
                            value={oldPassword || ""}
                            onChangeText={setOldPassword}
                            secureTextEntry={secure.old}
                            style={styles.input}
                            placeholderTextColor="#9E9E9E"
                            returnKeyType="next"
                        />
                        <TouchableOpacity onPress={() => setSecure((s) => ({ ...s, old: !s.old }))}>
                            <Ionicons name={secure.old ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Mật khẩu mới"
                            value={newPassword || ""}
                            onChangeText={setNewPassword}
                            secureTextEntry={secure.next}
                            style={styles.input}
                            placeholderTextColor="#9E9E9E"
                            returnKeyType="next"
                        />
                        <TouchableOpacity onPress={() => setSecure((s) => ({ ...s, next: !s.next }))}>
                            <Ionicons name={secure.next ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            placeholder="Xác nhận mật khẩu mới"
                            value={confirmPassword || ""}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={secure.confirm}
                            style={styles.input}
                            placeholderTextColor="#9E9E9E"
                            returnKeyType="done"
                            onSubmitEditing={handleSubmit}
                        />
                        <TouchableOpacity onPress={() => setSecure((s) => ({ ...s, confirm: !s.confirm }))}>
                            <Ionicons name={secure.confirm ? "eye-off-outline" : "eye-outline"} size={22} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, changePasswordMutation.isPending && { opacity: 0.7 }]} onPress={handleSubmit} disabled={changePasswordMutation.isPending}>
                        <Text style={styles.submitText}>{changePasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingTop: 50, },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },
    backBtn: { padding: 4, marginRight: 8 },
    title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600", marginRight: 32 },
    form: { padding: 16, gap: 14 },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fafafa",
    },
    input: { flex: 1, fontSize: 16, padding: 0 },
    submitBtn: {
        marginTop: 6,
        backgroundColor: "#34C759",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});


