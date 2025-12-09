import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main content fade in and scale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      // Pulse animation for icon container
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      // Loading dots animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(dot2Anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(dot3Anim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ),
      // Background circles animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle1Anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circle1Anim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(circle2Anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circle2Anim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(circle3Anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(circle3Anim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Auto finish after 2 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 5000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  const dot1Opacity = dot1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const dot2Opacity = dot2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const dot3Opacity = dot3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const circle1Scale = circle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const circle1Opacity = circle1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0],
  });

  const circle2Scale = circle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const circle2Opacity = circle2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0],
  });

  const circle3Scale = circle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const circle3Opacity = circle3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0],
  });

  return (
    <View className="flex-1 items-center justify-center bg-primary-600">
      {/* Animated background circles */}
      <Animated.View
        className="absolute w-96 h-96 rounded-full border-4 border-white/20"
        style={{
          transform: [{ scale: circle1Scale }],
          opacity: circle1Opacity,
        }}
      />
      <Animated.View
        className="absolute w-80 h-80 rounded-full border-4 border-white/25"
        style={{
          transform: [{ scale: circle2Scale }],
          opacity: circle2Opacity,
        }}
      />
      <Animated.View
        className="absolute w-72 h-72 rounded-full border-4 border-white/20"
        style={{
          transform: [{ scale: circle3Scale }],
          opacity: circle3Opacity,
        }}
      />

      {/* Main content */}
      <Animated.View
        className="items-center justify-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Icon container with pulse animation */}
        <Animated.View
          className="mb-8 bg-white/20 rounded-full p-8 shadow-2xl"
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <MaterialIcons name="two-wheeler" size={96} color="#FFFFFF" />
        </Animated.View>

        {/* App Name */}
        <Text className="text-5xl font-bold text-white mb-3 tracking-tight">
          Rental Bike
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-white/90 mb-12 font-medium">
          Thuê xe máy dễ dàng
        </Text>

        {/* Loading indicator */}
        <View className="flex-row items-center gap-3">
          <Animated.View
            className="w-3 h-3 rounded-full bg-white"
            style={{ opacity: dot1Opacity }}
          />
          <Animated.View
            className="w-3 h-3 rounded-full bg-white"
            style={{ opacity: dot2Opacity }}
          />
          <Animated.View
            className="w-3 h-3 rounded-full bg-white"
            style={{ opacity: dot3Opacity }}
          />
        </View>
      </Animated.View>
    </View>
  );
}
