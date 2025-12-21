interface RoutesType {
  LOGIN: string
  HOME: string
  KYC: string
  USERS: string
  VEHICLES: string
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
  NOTIFICATIONS: '/notifications',
} satisfies RoutesType

export default ROUTES
