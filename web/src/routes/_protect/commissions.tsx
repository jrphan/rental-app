import { createFileRoute } from '@tanstack/react-router'
import CommissionsPage from '@/pages/commissions'

export const Route = createFileRoute('/_protect/commissions')({
  component: CommissionsPage,
})
