import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { type Notification } from '@/services/api.notification'
import { getAuthCache } from '@/store/auth'

// Get API URL from environment
const getApiUrl = () => {
  if (typeof window !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Fallback - should be set in environment
  return 'http://localhost:3000'
}

interface UseNotificationSocketOptions {
  enabled?: boolean
  onNotification?: (notification: Notification) => void
  onUnreadCountUpdate?: (count: number) => void
}

export function useNotificationSocket(
  options: UseNotificationSocketOptions = {},
) {
  const { enabled = true, onNotification, onUnreadCountUpdate } = options
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const connectSocket = async () => {
      try {
        // Get authentication token
        const authData = getAuthCache()
        const token = authData?.token
        if (!token) {
          console.log('[WebSocket] No auth token, skipping connection')
          return
        }

        // Disconnect existing socket if any
        if (socketRef.current?.connected) {
          socketRef.current.disconnect()
        }

        const apiUrl = getApiUrl()
        // Remove trailing slash if present
        let baseUrl = apiUrl.replace(/\/$/, '')

        // Remove /api prefix if present (WebSocket gateway is not under global prefix)
        // API URL might be: http://host:port/api
        // WebSocket should connect to: http://host:port/notifications
        baseUrl = baseUrl.replace(/\/api$/, '')

        // Socket.IO namespace format: baseUrl/namespace
        // Backend gateway is at namespace '/notifications'
        const socketUrl = `${baseUrl}/notifications`

        console.log('[WebSocket] Connection details:', {
          apiUrl,
          baseUrl,
          socketUrl,
          hasToken: !!token,
          tokenLength: token?.length,
        })

        // Create new socket connection
        const socket = io(socketUrl, {
          auth: {
            token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          // Force websocket first, fallback to polling
          upgrade: true,
          rememberUpgrade: true,
        })

        socketRef.current = socket

        // Connection handlers
        socket.on('connect', () => {
          console.log('[WebSocket] Connected:', socket.id)
          // Clear any pending reconnection timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
        })

        socket.on('disconnect', (reason) => {
          console.log('[WebSocket] Disconnected:', reason)

          // If disconnected unexpectedly, try to reconnect after delay
          if (
            reason === 'io server disconnect' ||
            reason === 'transport close'
          ) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSocket()
            }, 5000)
          }
        })

        socket.on(
          'connect_error',
          (
            error: Error & {
              type?: string
              description?: string
              context?: any
            },
          ) => {
            console.error('[WebSocket] Connection error:', error.message)
            console.error('[WebSocket] Error details:', {
              message: error.message,
              type: error.type,
              description: error.description,
              context: error.context,
            })
          },
        )

        // Notification handlers
        socket.on('notification', (notification: Notification) => {
          console.log('[WebSocket] Received notification:', notification)

          // Invalidate notifications queries to refetch
          queryClient.invalidateQueries({ queryKey: ['notifications'] })

          // Check if notification is about vehicle (approval/rejection)
          // Based on title or message containing vehicle-related keywords
          const isVehicleNotification =
            notification.title?.toLowerCase().includes('xe') ||
            notification.message?.toLowerCase().includes('xe') ||
            notification.title?.toLowerCase().includes('vehicle') ||
            notification.message?.toLowerCase().includes('vehicle') ||
            notification.data?.vehicleId ||
            notification.data?.vehicle

          if (isVehicleNotification) {
            console.log(
              '[WebSocket] Vehicle notification detected, invalidating vehicle queries',
            )
            // Invalidate all vehicle-related queries
            queryClient.invalidateQueries({ queryKey: ['myVehicles'] })
            // Also invalidate specific vehicle queries if vehicleId is available
            if (notification.data?.vehicleId) {
              queryClient.invalidateQueries({
                queryKey: ['vehicle', notification.data.vehicleId],
              })
            }
          }

          // Check if notification is about KYC (approval/rejection)
          // Based on title, message, type, or data containing KYC-related keywords
          const isKycNotification =
            notification.type === 'KYC_UPDATE' ||
            notification.title?.toLowerCase().includes('kyc') ||
            notification.message?.toLowerCase().includes('kyc') ||
            notification.title?.toLowerCase().includes('xác thực') ||
            notification.message?.toLowerCase().includes('xác thực') ||
            notification.title?.toLowerCase().includes('duyệt') ||
            notification.data?.kycId ||
            notification.data?.kyc

          if (isKycNotification) {
            console.log(
              '[WebSocket] KYC notification detected, invalidating user queries',
            )
            // Invalidate user queries to refetch user info with updated KYC status
            queryClient.invalidateQueries({ queryKey: ['user'] })
            queryClient.invalidateQueries({ queryKey: ['user', 'sync'] })
          }

          // Call custom handler if provided
          if (onNotification) {
            onNotification(notification)
          }
        })

        socket.on('unread_count', (data: { count: number }) => {
          console.log('[WebSocket] Unread count update:', data.count)

          // Invalidate unread count query
          queryClient.invalidateQueries({
            queryKey: ['notifications', 'unread'],
          })
          queryClient.invalidateQueries({
            queryKey: ['notificationUnreadCount'],
          })

          // Call custom handler if provided
          if (onUnreadCountUpdate) {
            onUnreadCountUpdate(data.count)
          }
        })
      } catch (error) {
        console.error('[WebSocket] Failed to connect:', error)
      }
    }

    connectSocket()

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current?.connected) {
        socketRef.current.disconnect()
      }
      socketRef.current = null
    }
  }, [enabled, queryClient, onNotification, onUnreadCountUpdate])

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
  }
}
