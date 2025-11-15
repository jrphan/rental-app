-- Add isPhoneVerified column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Add index for isPhoneVerified
CREATE INDEX IF NOT EXISTS "users_isPhoneVerified_idx" ON "users"("isPhoneVerified");

-- Add type column to otps table (with default value)
ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "type" "OtpType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- Add phone column to otps table
ALTER TABLE "otps" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Add indexes for otps table
CREATE INDEX IF NOT EXISTS "otps_type_idx" ON "otps"("type");
CREATE INDEX IF NOT EXISTS "otps_phone_idx" ON "otps"("phone");
