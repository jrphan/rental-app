export const ENV = {
  port: process.env.PORT ?? 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  // Mail configuration - Resend
  mailFrom: process.env.MAIL_FROM ?? 'noreply@rentalapp.com',
  resendApiKey: process.env.RESEND_API_KEY,
  // AWS S3 configuration
  aws: {
    region: process.env.AWS_REGION ?? 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
    s3BaseUrl: process.env.AWS_S3_BASE_URL,
  },
};
