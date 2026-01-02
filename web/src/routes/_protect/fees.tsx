import { createFileRoute } from '@tanstack/react-router'
import FeesPage from '@/pages/fees'

export const Route = createFileRoute('/_protect/fees')({
  component: FeesPage,
})
