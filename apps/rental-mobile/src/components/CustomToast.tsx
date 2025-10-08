import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { BaseToastProps } from "react-native-toast-message";
import { COLORS } from "../constants/colors";

function ToastBase({
  text1,
  text2,
  bgColor,
  accentColor,
  icon,
}: {
  text1?: string;
  text2?: string;
  bgColor: string;
  accentColor: string;
  icon: string;
}) {
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.contentWrapper}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.texts}>
          {!!text1 && (
            <Text numberOfLines={1} style={styles.title}>
              {text1}
            </Text>
          )}
          {!!text2 && (
            <Text numberOfLines={2} style={styles.subtitle}>
              {text2}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export const toastConfig = {
  success: ({ text1, text2 }: BaseToastProps) => (
    <ToastBase
      text1={text1}
      text2={text2}
      bgColor={COLORS.surface}
      accentColor={COLORS.success}
      icon="✅"
    />
  ),
  error: ({ text1, text2 }: BaseToastProps) => (
    <ToastBase
      text1={text1}
      text2={text2}
      bgColor={COLORS.surface}
      accentColor={COLORS.error}
      icon="⛔"
    />
  ),
  info: ({ text1, text2 }: BaseToastProps) => (
    <ToastBase
      text1={text1}
      text2={text2}
      bgColor={COLORS.surface}
      accentColor={COLORS.info}
      icon="ℹ️"
    />
  ),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "95%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    marginRight: 12,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  texts: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});

export default toastConfig;
