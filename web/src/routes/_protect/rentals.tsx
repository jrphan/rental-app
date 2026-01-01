import RentalsPage from '@/pages/rentals'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protect/rentals')({
  component: RentalsPage,
})

