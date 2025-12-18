import { createFileRoute } from '@tanstack/react-router'
import NotificationsPage from '@/pages/notifications'

export const Route = createFileRoute('/_protect/notifications')({
  component: NotificationsPage,
})

