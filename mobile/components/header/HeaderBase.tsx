import { useRouter } from "expo-router";
import { View, TouchableOpacity, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface HeaderBaseProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  action?: React.ReactNode;
}

export default function HeaderBase({
  title,
  showBackButton,
  onBackPress,
  action,
}: HeaderBaseProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      {showBackButton ? (
        <TouchableOpacity onPress={handleBackPress}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {action ? <View>{action}</View> : <View style={{ width: 24 }} />}
    </View>
  );
}
