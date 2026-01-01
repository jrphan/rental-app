import DashboardPage from '@/pages/admin/DashboardPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protect/')({
  component: DashboardPage,
})
