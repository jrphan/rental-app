import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { COLORS } from "@/constants/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  email?: string;
  iconName: Parameters<typeof IconSymbol>[0]["name"];
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export function AuthLayout({
  title,
  subtitle,
  email,
  iconName,
  children,
  footer,
  showBackButton = false,
  onBackPress,
}: AuthLayoutProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Decorative Background */}
      <View className="absolute top-0 left-0 right-0 h-80 bg-primary-500 opacity-10" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Back Button */}
        {showBackButton && (
          <View className="absolute top-4 left-4 z-10">
            <TouchableOpacity
              onPress={handleBackPress}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg"
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-8"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header Section */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary-500 shadow-lg">
              <MaterialCommunityIcons
                name="motorbike"
                size={40}
                color={"white"}
              />
            </View>
            <Text className="mb-2 text-3xl font-extrabold text-gray-900">
              {title}
            </Text>
            <Text className="text-center text-base text-gray-600">
              {subtitle}
            </Text>
            {email && (
              <Text className="text-center text-base text-primary-500">
                {email}
              </Text>
            )}
          </View>

          {/* Form Card */}
          <View className="rounded-3xl bg-white p-6 shadow-xl">{children}</View>

          {/* Footer */}
          {footer && <View className="mt-6">{footer}</View>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
