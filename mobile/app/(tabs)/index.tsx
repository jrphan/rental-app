import { ScrollView } from "react-native";
import ButtonDemo from "@/components/ButtonDemo";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ButtonDemo />
    </ScrollView>
  );
}
