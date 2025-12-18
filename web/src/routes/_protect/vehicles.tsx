import VehiclesPage from '@/pages/vehicles'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protect/vehicles')({
  component: VehiclesPage,
})
