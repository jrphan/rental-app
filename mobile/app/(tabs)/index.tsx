import { Button } from "@/components/ui/button";
import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Text className="text-xl">
        <Button>Click me</Button>
      </Text>
    </View>
  );
}
