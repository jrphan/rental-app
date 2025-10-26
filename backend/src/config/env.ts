export const ENV = {
  port: process.env.PORT ?? 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
};
