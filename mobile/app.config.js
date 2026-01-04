export default {
  expo: {
    name: "Rental Bike",
    slug: "mobile",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rentalbike",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rentalbike.app",
    },
    android: {
      icon: "./assets/images/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#E6F4FE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.rentalbike.app",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      },
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#EA580C",
          dark: {
            backgroundColor: "#EA580C",
          },
        },
      ],
      "expo-web-browser",
      "expo-font",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Cho phép $(PRODUCT_NAME) sử dụng vị trí của bạn để tìm xe gần nhất.",
          locationAlwaysPermission:
            "Cho phép $(PRODUCT_NAME) sử dụng vị trí của bạn để tìm xe gần nhất.",
          locationWhenInUsePermission:
            "Cho phép $(PRODUCT_NAME) sử dụng vị trí của bạn để tìm xe gần nhất.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#EA580C",
          sounds: [],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "abba22f2-d2ed-4ee2-b561-121c5d05f7cf",
      },
    },
  },
};
