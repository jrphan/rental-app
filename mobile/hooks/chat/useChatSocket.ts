import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthCache } from "@/store/auth";
import type { ChatMessage } from "@/services/api.chat";

// Get API URL from environment or use default
const getApiUrl = () => {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return "http://localhost:3000";
};

interface UseChatSocketOptions {
  enabled?: boolean;
  chatId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onMessagesRead?: (data: { chatId: string; userId: string }) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const { enabled = true, chatId, onNewMessage, onMessagesRead } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !chatId) {
      return;
    }

    const connectSocket = async () => {
      try {
        const authData = getAuthCache();
        const token = authData?.token;
        if (!token) {
          console.warn("[ChatSocket] ❌ No auth token, skipping connection");
          return;
        }

        if (socketRef.current?.connected) {
          console.log("[ChatSocket] 🔄 Disconnecting existing socket");
          socketRef.current.disconnect();
        }

        const apiUrl = getApiUrl();
        let baseUrl = apiUrl.replace(/\/$/, "");
        baseUrl = baseUrl.replace(/\/api$/, "");
        const socketUrl = `${baseUrl}/chat`;

        console.log("[ChatSocket] 🔌 Connecting to:", socketUrl);
        console.log("[ChatSocket] 📋 Connection details:", {
          apiUrl,
          baseUrl,
          socketUrl,
          hasToken: !!token,
          tokenLength: token?.length,
          chatId,
        });

        const socket = io(socketUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          upgrade: true,
          rememberUpgrade: true,
          // Debug options
          forceNew: false,
          timeout: 20000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on("connect", () => {
          console.log("[ChatSocket] ✅ Connected successfully");
          console.log("[ChatSocket] 📍 Socket ID:", socket.id);
          console.log(
            "[ChatSocket] 🔗 Transport:",
            socket.io.engine.transport.name
          );
          // Join chat room
          console.log("[ChatSocket] 🚪 Joining chat room:", chatId);
          socket.emit("join_chat", { chatId }, (response: any) => {
            if (response?.error) {
              console.error(
                "[ChatSocket] ❌ Failed to join chat:",
                response.error
              );
            } else {
              console.log(
                "[ChatSocket] ✅ Joined chat successfully:",
                response
              );
            }
          });
        });

        socket.on("disconnect", (reason) => {
          console.warn("[ChatSocket] ⚠️ Disconnected:", reason);
          console.log("[ChatSocket] 📊 Disconnect details:", {
            reason,
            wasConnected: socket.connected,
            socketId: socket.id,
          });
        });

        socket.on("connect_error", (error) => {
          console.error("[ChatSocket] ❌ Connection error:", error.message);
          console.error("[ChatSocket] 🔍 Error details:", {
            message: error.message,
            type: (error as any).type,
            description: (error as any).description,
            transport: socket.io?.engine?.transport?.name,
          });
        });

        socket.on("reconnect", (attemptNumber) => {
          console.log(
            "[ChatSocket] 🔄 Reconnected after",
            attemptNumber,
            "attempts"
          );
        });

        socket.on("reconnect_attempt", (attemptNumber) => {
          console.log("[ChatSocket] 🔄 Reconnection attempt:", attemptNumber);
        });

        socket.on("reconnect_error", (error) => {
          console.error("[ChatSocket] ❌ Reconnection error:", error.message);
        });

        socket.on("reconnect_failed", () => {
          console.error(
            "[ChatSocket] ❌ Reconnection failed after max attempts"
          );
        });

        // Message events
        socket.on("new_message", (message: ChatMessage) => {
          console.log("[ChatSocket] 📨 New message received:", {
            messageId: message.id,
            chatId: message.chatId,
            senderId: message.senderId,
            content: message.content.substring(0, 50) + "...",
            timestamp: message.createdAt,
          });
          if (onNewMessage) {
            onNewMessage(message);
            // If onNewMessage callback is provided, it handles the cache update
            // Only invalidate the chats list, not individual messages (to avoid duplicates)
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          } else {
            // If no callback, invalidate to trigger refetch
            queryClient.invalidateQueries({
              queryKey: ["chat", chatId, "messages"],
            });
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }
        });

        socket.on(
          "messages_read",
          (data: { chatId: string; userId: string }) => {
            console.log("[ChatSocket] ✅ Messages read:", data);
            if (onMessagesRead) {
              onMessagesRead(data);
            }
            queryClient.invalidateQueries({
              queryKey: ["chat", chatId, "messages"],
            });
          }
        );

        socket.on(
          "chat_message",
          (data: { chatId: string; message: ChatMessage }) => {
            // Notification for messages in other chats
            console.log("[ChatSocket] 🔔 Chat message notification:", {
              chatId: data.chatId,
              messageId: data.message.id,
            });
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          }
        );

        // Debug: Log all events
        const originalEmit = socket.emit.bind(socket);
        socket.emit = function (event: string, ...args: any[]) {
          console.log("[ChatSocket] 📤 Emitting event:", event, args);
          return originalEmit(event, ...args);
        };

        return () => {
          if (socketRef.current?.connected) {
            socket.emit("leave_chat", { chatId });
            socket.disconnect();
          }
        };
      } catch (error) {
        console.error("Failed to connect chat socket:", error);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("leave_chat", { chatId });
        socketRef.current.disconnect();
      }
    };
  }, [enabled, chatId, onNewMessage, onMessagesRead, queryClient]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socketRef.current?.connected && chatId) {
        console.log("[ChatSocket] 📤 Sending message:", {
          chatId,
          contentLength: content.length,
        });
        socketRef.current.emit(
          "send_message",
          { chatId, content },
          (response: any) => {
            if (response?.error) {
              console.error(
                "[ChatSocket] ❌ Send message error:",
                response.error
              );
            } else {
              console.log("[ChatSocket] ✅ Message sent successfully");
            }
          }
        );
      } else {
        console.warn("[ChatSocket] ⚠️ Cannot send message:", {
          connected: socketRef.current?.connected,
          chatId,
        });
      }
    },
    [chatId]
  );

  const markAsRead = useCallback(() => {
    if (socketRef.current?.connected && chatId) {
      console.log("[ChatSocket] ✅ Marking messages as read:", chatId);
      socketRef.current.emit("mark_read", { chatId }, (response: any) => {
        if (response?.error) {
          console.error("[ChatSocket] ❌ Mark read error:", response.error);
        } else {
          console.log("[ChatSocket] ✅ Messages marked as read");
        }
      });
    }
  }, [chatId]);

  // Debug info
  const getDebugInfo = useCallback(() => {
    const socket = socketRef.current;
    return {
      isConnected: socket?.connected || false,
      socketId: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || null,
      chatId,
      enabled,
    };
  }, [chatId, enabled]);

  return {
    sendMessage,
    markAsRead,
    isConnected: socketRef.current?.connected || false,
    getDebugInfo,
    socket: socketRef.current,
  };
}
