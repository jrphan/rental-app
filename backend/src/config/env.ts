export const ENV = {
  port: process.env.PORT ?? 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  // Mail configuration
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT) : 587,
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailUser: process.env.MAIL_USER,
  mailPassword: process.env.MAIL_PASSWORD,
  mailFrom: process.env.MAIL_FROM ?? 'noreply@rentalapp.com',
};
