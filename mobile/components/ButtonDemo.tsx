import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Button } from "./ui/button";

export default function ButtonDemo() {
  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6 text-center">
        Button Component Demo
      </Text>

      {/* Variants */}
      <View className="mb-8">
        <Text className="text-lg font-semibold mb-4">Variants</Text>
        <View className="space-y-3">
          <Button
            variant="primary"
            onPress={() => console.log("Primary pressed")}
          >
            Primary Button
          </Button>
          <Button
            variant="secondary"
            onPress={() => console.log("Secondary pressed")}
          >
            Secondary Button
          </Button>
          <Button
            variant="outline"
            onPress={() => console.log("Outline pressed")}
          >
            Outline Button
          </Button>
          <Button variant="ghost" onPress={() => console.log("Ghost pressed")}>
            Ghost Button
          </Button>
          <Button
            variant="destructive"
            onPress={() => console.log("Destructive pressed")}
          >
            Destructive Button
          </Button>
        </View>
      </View>

      {/* Sizes */}
      <View className="mb-8">
        <Text className="text-lg font-semibold mb-4">Sizes</Text>
        <View className="space-y-3">
          <Button size="sm" onPress={() => console.log("Small pressed")}>
            Small Button
          </Button>
          <Button size="md" onPress={() => console.log("Medium pressed")}>
            Medium Button
          </Button>
          <Button size="lg" onPress={() => console.log("Large pressed")}>
            Large Button
          </Button>
          <Button size="xl" onPress={() => console.log("Extra Large pressed")}>
            Extra Large Button
          </Button>
        </View>
      </View>

      {/* States */}
      <View className="mb-8">
        <Text className="text-lg font-semibold mb-4">States</Text>
        <View className="space-y-3">
          <Button onPress={() => console.log("Normal pressed")}>
            Normal Button
          </Button>
          <Button disabled onPress={() => console.log("Disabled pressed")}>
            Disabled Button
          </Button>
          <Button loading onPress={() => console.log("Loading pressed")}>
            Loading Button
          </Button>
          <Button
            loading
            onPress={() => console.log("Loading with text pressed")}
          >
            Loading with Text
          </Button>
        </View>
      </View>

      {/* Full Width */}
      <View className="mb-8">
        <Text className="text-lg font-semibold mb-4">Full Width</Text>
        <Button fullWidth onPress={() => console.log("Full width pressed")}>
          Full Width Button
        </Button>
      </View>

      {/* Custom Styling */}
      <View className="mb-8">
        <Text className="text-lg font-semibold mb-4">Custom Styling</Text>
        <View className="space-y-3">
          <Button
            className="bg-purple-600 active:bg-purple-700"
            textClassName="text-yellow-200"
            onPress={() => console.log("Custom styled pressed")}
          >
            Custom Styled Button
          </Button>
          <Button
            variant="outline"
            className="border-green-500 border-2"
            textClassName="text-green-600"
            onPress={() => console.log("Custom outline pressed")}
          >
            Custom Outline Button
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
