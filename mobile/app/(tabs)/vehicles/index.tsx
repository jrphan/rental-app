import { Text, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VehiclesScreen() {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <Text>Vehicles</Text>
      </SafeAreaView>
    </>
  );
}
