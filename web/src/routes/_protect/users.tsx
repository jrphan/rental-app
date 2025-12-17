import UsersPage from '@/pages/users'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protect/users')({
  component: UsersPage,
})


