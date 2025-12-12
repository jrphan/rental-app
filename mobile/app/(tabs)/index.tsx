import { Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <Text>Home</Text>
      </SafeAreaView>
    </>
  );
}
