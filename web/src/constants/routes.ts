interface RoutesType {
  HOME: string
  BOOKINGS: string
  PROFILE: string
  SETTINGS: string
  LOGIN: string
  REGISTER: string
  FORGOT_PASSWORD: string
  VERIFY_OTP: ([userId, phone]: [string, string]) => string
  RESET_PASSWORD: string
}

const ROUTES = {
  //Tabs routes
  HOME: '/admin/',
  BOOKINGS: '/admin/bookings',
  PROFILE: '/admin/profile',
  SETTINGS: '/admin/settings',

  //Auth routes
  LOGIN: '/admin/login' as string,
  REGISTER: '/admin/register' as string,
  FORGOT_PASSWORD: '/admin/forgot-password' as string,
  VERIFY_OTP: ([userId, phone]: [string, string]) =>
    `/admin/verify-otp?userId=${encodeURIComponent(
      userId,
    )}&phone=${encodeURIComponent(phone)}` as string,
  RESET_PASSWORD: '/admin/reset-password' as string,
} satisfies RoutesType

export default ROUTES
