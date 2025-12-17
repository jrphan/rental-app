import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/pages/admin/LoginPage'

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
})
