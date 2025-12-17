interface RoutesType {
  LOGIN: string
  HOME: string
  KYC: string
}

const ROUTES = {
  // Public routes
  LOGIN: '/login',

  // Admin routes
  HOME: '/',
  KYC: '/kyc',
} satisfies RoutesType

export default ROUTES
