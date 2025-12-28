import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SocketDebugPanelProps {
  chatId?: string;
  enabled?: boolean;
}

export default function SocketDebugPanel({
  chatId,
  enabled = true,
}: SocketDebugPanelProps) {
  const { isConnected, getDebugInfo, socket } = useChatSocket({
    enabled,
    chatId,
  });

  const [showDetails, setShowDetails] = useState(false);
  const debugInfo = getDebugInfo();

  if (!enabled) {
    return null;
  }

  return (
    <View className="absolute bottom-20 right-4 z-50">
      <TouchableOpacity
        onPress={() => setShowDetails(!showDetails)}
        className={`rounded-full p-3 ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      >
        <MaterialIcons
          name={isConnected ? "wifi" : "wifi-off"}
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {showDetails && (
        <View className="absolute bottom-14 right-0 bg-white rounded-lg p-4 shadow-lg min-w-[280px] max-w-[320px]">
          <ScrollView>
            <View className="mb-3">
              <Text className="text-lg font-bold text-gray-900 mb-2">
                Socket Debug Info
              </Text>
              <View className="flex-row items-center mb-1">
                <View
                  className={`w-3 h-3 rounded-full mr-2 ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <Text className="text-sm text-gray-700">
                  Status: {isConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>

            <View className="border-t border-gray-200 pt-2">
              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Socket ID:
              </Text>
              <Text className="text-xs text-gray-800 mb-2 font-mono">
                {debugInfo.socketId || "N/A"}
              </Text>

              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Transport:
              </Text>
              <Text className="text-xs text-gray-800 mb-2">
                {debugInfo.transport || "N/A"}
              </Text>

              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Chat ID:
              </Text>
              <Text className="text-xs text-gray-800 mb-2 font-mono">
                {debugInfo.chatId || "N/A"}
              </Text>

              <Text className="text-xs font-semibold text-gray-600 mb-1">
                Enabled:
              </Text>
              <Text className="text-xs text-gray-800 mb-2">
                {debugInfo.enabled ? "Yes" : "No"}
              </Text>

              {socket && (
                <>
                  <Text className="text-xs font-semibold text-gray-600 mb-1 mt-2">
                    Socket Events:
                  </Text>
                  <Text className="text-xs text-gray-800">
                    Connected: {socket.connected ? "Yes" : "No"}
                  </Text>
                  <Text className="text-xs text-gray-800">
                    Disconnected: {socket.disconnected ? "Yes" : "No"}
                  </Text>
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                console.log("[SocketDebug] Full debug info:", {
                  ...debugInfo,
                  socket: socket
                    ? {
                        id: socket.id,
                        connected: socket.connected,
                        disconnected: socket.disconnected,
                        transport: socket.io?.engine?.transport?.name,
                      }
                    : null,
                });
              }}
              className="mt-3 bg-blue-500 rounded px-3 py-2"
            >
              <Text className="text-white text-xs text-center">
                Log to Console
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

