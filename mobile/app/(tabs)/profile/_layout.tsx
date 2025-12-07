import { Stack } from "expo-router";

export default function ProfileLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "slide_from_right",
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="edit-profile"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
			<Stack.Screen
				name="change-password"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
			<Stack.Screen
				name="kyc"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
			<Stack.Screen
				name="vehicle-create"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
			<Stack.Screen
				name="my-vehicles"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
		</Stack>
	);
}
