import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import ChatTab from "./chat";
import NotificationsTab from "./notifications";
import { Tabs } from "@/components/ui/tabs";
import type { TabConfig } from "@/components/ui/tabs";
import HeaderBase from "@/components/header/HeaderBase";

export default function MessagesLayout() {
  const tabs = useMemo<TabConfig[]>(
    () => [
      {
        label: "Thông báo",
        value: "notifications",
        route: "/(tabs)/messages/notifications",
        // Use contentFactory for lazy loading
        contentFactory: () => <NotificationsTab />,
      },
      {
        label: "Nhắn tin",
        value: "chat",
        route: "/(tabs)/messages/chat",
        // Use contentFactory for lazy loading
        contentFactory: () => <ChatTab />,
      },
    ],
    []
  );

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
        <HeaderBase title="Tin nhắn" showBackButton />

        <Tabs tabs={tabs} variant="pill" />
      </SafeAreaView>
    </>
  );
}
