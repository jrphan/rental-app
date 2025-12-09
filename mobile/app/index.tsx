import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SplashScreen as CustomSplashScreen } from "@/components/SplashScreen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // Wait for store to hydrate
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        // Hide native splash screen
        await SplashScreen.hideAsync();
        // Show custom splash for a bit longer
        setTimeout(() => {
          setShowCustomSplash(false);
        }, 500);
      }
    }

    prepare();
  }, []);

  if (showCustomSplash) {
    return (
      <CustomSplashScreen
        onFinish={() => {
          setShowCustomSplash(false);
        }}
      />
    );
  }

  if (!isReady) {
    return null;
  }

  return <Redirect href="/(tabs)" />;
}
