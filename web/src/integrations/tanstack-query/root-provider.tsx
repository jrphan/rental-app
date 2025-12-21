import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotificationSocket } from '@/hooks/notifications/useNotificationSocket'
import { useAuthStore } from '@/store/auth'

export function getContext() {
  const queryClient = new QueryClient()
  return {
    queryClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  const { isAuthenticated } = useAuthStore()

  // Setup WebSocket connection for real-time notifications
  useNotificationSocket({
    enabled: isAuthenticated,
  })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
