import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore, ToastType } from "@/store/toast";
import { cn } from "@/lib/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const toastStyles: Record<
  ToastType,
  { bg: string; text: string; icon: string; iconColor: string }
> = {
  success: {
    bg: "bg-green-50 border-green-200",
    text: "text-green-900",
    icon: "check-circle",
    iconColor: "#10B981",
  },
  error: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-900",
    icon: "error",
    iconColor: "#EF4444",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-900",
    icon: "info",
    iconColor: "#3B82F6",
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-900",
    icon: "warning",
    iconColor: "#F59E0B",
  },
};

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  onPress?: () => void;
  onHide: (id: string) => void;
}

function ToastItem({
  id,
  message,
  type,
  title,
  onPress,
  onHide,
}: ToastItemProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleHide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(id);
    });
  };

  const style = toastStyles[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          onPress?.();
          handleHide();
        }}
        className={cn("rounded-2xl border-2 p-4 shadow-lg", style.bg)}
      >
        <View className="flex-row items-start">
          <MaterialIcons
            name={style.icon as any}
            size={24}
            color={style.iconColor}
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <View className="flex-1">
            {title && (
              <Text className={cn("text-base font-bold mb-1", style.text)}>
                {title}
              </Text>
            )}
            <Text className={cn("text-sm", style.text)}>{message}</Text>
          </View>
          <TouchableOpacity
            onPress={handleHide}
            className="ml-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={18} color={style.iconColor} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const hide = useToastStore((state) => state.hide);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.toastContainer, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          title={toast.title}
          onPress={toast.onPress}
          onHide={hide}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    alignItems: "stretch",
    pointerEvents: "box-none",
  },
  container: {
    marginBottom: 12,
    width: "100%",
  },
});
