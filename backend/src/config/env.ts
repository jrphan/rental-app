export const ENV = {
  port: process.env.PORT ?? 3000,
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION ?? '7d',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    'your-refresh-secret-key-change-in-production',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '30d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  // Mail configuration - Resend
  mailFrom: process.env.MAIL_FROM ?? 'noreply@rentalapp.com',
  resendApiKey: process.env.RESEND_API_KEY,
  // SMS configuration
  sms: {
    provider: process.env.SMS_PROVIDER || 'development', // 'development' | 'production'
    // AWS SNS configuration (for production)
    awsAccessKeyId: process.env.AWS_SMS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SMS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_SMS_REGION || 'ap-southeast-1',
  },
  // AWS S3 configuration
  aws: {
    region: process.env.AWS_REGION ?? 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
    s3BaseUrl: process.env.AWS_S3_BASE_URL,
  },
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB) || 0,
  },
  // OTP Rate limiting
  otpRateLimit: {
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5, // Số lần tối đa trong window
    windowMinutes: Number(process.env.OTP_WINDOW_MINUTES) || 15, // Thời gian window (phút)
  },
};
