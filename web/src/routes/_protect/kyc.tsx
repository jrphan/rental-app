import KycPage from '@/pages/kyc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protect/kyc')({
  component: KycPage,
})
