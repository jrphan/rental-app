export const ENV = {
  port: process.env.PORT ?? 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  // Mail configuration - Resend
  mailFrom: process.env.MAIL_FROM ?? 'noreply@rentalapp.com',
  resendApiKey: process.env.RESEND_API_KEY,
};
