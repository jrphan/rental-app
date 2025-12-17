interface RoutesType {
  LOGIN: string
  HOME: string
  KYC: string
  USERS: string
}

const ROUTES = {
  // Public routes
  LOGIN: '/login',

  // Admin routes
  HOME: '/',
  KYC: '/kyc',
  USERS: '/users',
} satisfies RoutesType

export default ROUTES
