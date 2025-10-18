import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useChangePassword } from "@/queries";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "@/schemas";
import { COLORS } from "@/constants/colors";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();

  const [secure, setSecure] = useState({
    old: true,
    next: true,
    confirm: true,
  });

  const { control, handleSubmit, reset } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema as any),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onValid: SubmitHandler<ChangePasswordFormData> = async ({
    oldPassword,
    newPassword,
  }) => {
    Keyboard.dismiss();
    try {
      await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
      reset();
      router.back();
    } catch (e) {}
  };

  const onInvalid = (errors: any) => {
    Keyboard.dismiss();
    const firstError = Object.values(errors)[0] as any;
    const message = firstError?.message || "Vui lòng kiểm tra lại thông tin";
    Toast.show({ type: "error", text1: "Không hợp lệ", text2: message });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Thiết lập mật khẩu</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="oldPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Mật khẩu cũ"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={secure.old}
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                    returnKeyType="next"
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setSecure((s) => ({ ...s, old: !s.old }))}
              >
                <Ionicons
                  name={secure.old ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Mật khẩu mới"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={secure.next}
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                    returnKeyType="next"
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setSecure((s) => ({ ...s, next: !s.next }))}
              >
                <Ionicons
                  name={secure.next ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Xác nhận mật khẩu mới"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={secure.confirm}
                    style={styles.input}
                    placeholderTextColor="#9E9E9E"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onValid, onInvalid)}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() =>
                  setSecure((s) => ({ ...s, confirm: !s.confirm }))
                }
              >
                <Ionicons
                  name={secure.confirm ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                changePasswordMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleSubmit(onValid, onInvalid)}
              disabled={changePasswordMutation.isPending}
            >
              <Text style={styles.submitText}>
                {changePasswordMutation.isPending
                  ? "Đang cập nhật..."
                  : "Cập nhật"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 32,
  },
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
