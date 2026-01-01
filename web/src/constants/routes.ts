interface RoutesType {
  LOGIN: string
  HOME: string
  KYC: string
  USERS: string
  VEHICLES: string
  RENTALS: string
  NOTIFICATIONS: string
}

const ROUTES = {
  // Public routes
  LOGIN: '/login',

  // Admin routes
  HOME: '/',
  KYC: '/kyc',
  USERS: '/users',
  VEHICLES: '/vehicles',
  RENTALS: '/rentals',
  NOTIFICATIONS: '/notifications',
} satisfies RoutesType

export default ROUTES
