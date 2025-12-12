import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SplashScreen as CustomSplashScreen } from "@/components/SplashScreen";

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
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
