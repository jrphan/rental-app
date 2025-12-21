-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."vehicle_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vehicle_favorites_userId_vehicleId_key" ON "public"."vehicle_favorites"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vehicle_favorites_userId_idx" ON "public"."vehicle_favorites"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vehicle_favorites_vehicleId_idx" ON "public"."vehicle_favorites"("vehicleId");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicle_favorites_userId_fkey'
    ) THEN
        ALTER TABLE "public"."vehicle_favorites" ADD CONSTRAINT "vehicle_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicle_favorites_vehicleId_fkey'
    ) THEN
        ALTER TABLE "public"."vehicle_favorites" ADD CONSTRAINT "vehicle_favorites_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

