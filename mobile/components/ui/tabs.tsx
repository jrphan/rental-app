import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ViewStyle,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { COLORS } from "@/constants/colors";

export interface TabConfig {
  label: string;
  value: string;
  route: string;
  content?: React.ReactNode;
  contentFactory?: () => React.ReactNode; // Lazy content factory - only called when tab is active
}

export interface TabsProps {
  tabs: TabConfig[];
  variant?: "default" | "pill" | "segmented" | "simple" | "inline";
  defaultActiveTab?: string;
  onTabChange?: (value: string, route?: string) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  contentClassName?: string;
}

const variantStyles = {
  default: {
    container: "flex-row border-b border-gray-200 bg-white",
    tab: "flex-1 py-4 items-center border-b-2",
    activeTab: "",
    activeText: "",
    inactiveText: "",
  },
  pill: {
    container: "flex-row bg-gray-100 rounded-lg p-1.5",
    tab: "flex-1 py-3 items-center rounded-md",
    activeTab: "bg-white",
    activeText: "",
    inactiveText: "",
  },
  segmented: {
    container:
      "flex-row border border-gray-200 rounded-lg bg-white overflow-hidden",
    tab: "flex-1 py-4 items-center border-r border-gray-200 last:border-r-0",
    activeTab: "bg-primary-50",
    activeText: "",
    inactiveText: "",
  },
  simple: {
    container: "flex-row bg-white",
    tab: "flex-1 py-4 items-center",
    activeTab: "",
    activeText: "",
    inactiveText: "",
  },
  inline: {
    container: "flex-row gap-2 bg-transparent py-2 px-2",
    tab: "w-fit px-4 py-2 items-center rounded-full border border-gray-200",
    activeTab: "bg-primary-500 border-primary-500",
    activeText: "",
    inactiveText: "",
  },
};

export function Tabs({
  tabs,
  variant = "default",
  defaultActiveTab,
  onTabChange,
  className,
  tabClassName,
  activeTabClassName,
  inactiveTextClassName,
  activeTextClassName,
  contentClassName,
}: TabsProps) {
  const baseStyles = variantStyles[variant];

  // Quản lý active tab bằng state nội bộ
  const initialActiveTab = useMemo(() => {
    return defaultActiveTab || tabs[0]?.value || "";
  }, [defaultActiveTab, tabs]);

  const [activeTab, setActiveTab] = useState(initialActiveTab);

  // Animation value cho content fade
  const contentOpacity = useSharedValue(1);

  // Cập nhật active tab khi defaultActiveTab thay đổi từ bên ngoài
  useEffect(() => {
    if (defaultActiveTab) {
      setActiveTab(defaultActiveTab);
    }
  }, [defaultActiveTab]);

  // Animate content fade khi active tab thay đổi
  useEffect(() => {
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, { duration: 200 });
  }, [activeTab, contentOpacity]);

  // Handler khi click vào tab
  const handleTabPress = useCallback(
    (tabValue: string, route?: string) => {
      setActiveTab(tabValue);
      // Gọi callback để parent component có thể handle navigation hoặc logic khác
      onTabChange?.(tabValue, route);
    },
    [onTabChange]
  );

  const getActiveTabStyle = (isActive: boolean): ViewStyle => {
    switch (variant) {
      case "default":
        return {
          borderBottomColor: isActive ? COLORS.primary : "transparent",
        };
      case "inline":
        return {
          backgroundColor: isActive ? COLORS.primary : "transparent",
        };
      default:
        return {};
    }
  };

  const getActiveTextColor = (isActive: boolean): string => {
    if (variant === "inline") {
      return isActive ? "#FFFFFF" : COLORS.inactive;
    }
    return isActive ? COLORS.primary : COLORS.inactive;
  };

  // Animated style cho content fade
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  // Lấy content từ active tab - use factory if available for lazy loading
  const activeTabConfig = tabs.find((tab) => tab.value === activeTab);
  const activeContent = useMemo(() => {
    if (!activeTabConfig) return null;
    // Prefer factory for lazy loading, fallback to content
    if (activeTabConfig.contentFactory) {
      return activeTabConfig.contentFactory();
    }
    return activeTabConfig.content;
  }, [activeTabConfig]);

  // Render tabs container - ScrollView cho inline variant, View cho các variant khác
  const renderTabsContainer = () => {
    const tabsContent = tabs.map((tab) => {
      const isActive = activeTab === tab.value;
      const tabStyle = getActiveTabStyle(isActive);
      const textColor = getActiveTextColor(isActive);

      return (
        <TouchableOpacity
          key={tab.value}
          className={cn(
            baseStyles.tab,
            isActive && baseStyles.activeTab,
            isActive && activeTabClassName,
            tabClassName
          )}
          style={tabStyle}
          onPress={() => handleTabPress(tab.value, tab.route)}
          activeOpacity={0.7}
        >
          <Text
            className={cn(
              variant === "inline" ? "text-sm" : "text-base",
              "font-semibold",
              isActive ? activeTextClassName : inactiveTextClassName
            )}
            style={{ color: textColor }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    });

    if (variant === "inline") {
      return (
        <View className={cn("bg-white", className)} style={{ flexShrink: 0 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className={baseStyles.container}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            {tabsContent}
          </ScrollView>
        </View>
      );
    }

    return (
      <View className={cn(baseStyles.container, className)}>{tabsContent}</View>
    );
  };

  // Nếu không có content, chỉ render tabs container
  if (!activeContent) {
    return <View>{renderTabsContainer()}</View>;
  }

  return (
    <View className="flex-1">
      {renderTabsContainer()}
      <Animated.View
        className={cn("flex-1", contentClassName)}
        style={contentAnimatedStyle}
      >
        {activeContent}
      </Animated.View>
    </View>
  );
}
