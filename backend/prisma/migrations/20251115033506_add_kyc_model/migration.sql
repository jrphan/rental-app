-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "kycs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idNumber" TEXT,
    "idCardFrontUrl" TEXT,
    "idCardBackUrl" TEXT,
    "passportUrl" TEXT,
    "driverLicenseUrl" TEXT,
    "selfieUrl" TEXT,
    "notes" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kycs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kycs_userId_key" ON "kycs"("userId");

-- CreateIndex
CREATE INDEX "kycs_userId_idx" ON "kycs"("userId");

-- CreateIndex
CREATE INDEX "kycs_status_idx" ON "kycs"("status");

-- CreateIndex
CREATE INDEX "kycs_reviewedBy_idx" ON "kycs"("reviewedBy");

-- CreateIndex
CREATE INDEX "kycs_createdAt_idx" ON "kycs"("createdAt");

-- AddForeignKey
ALTER TABLE "kycs" ADD CONSTRAINT "kycs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kycs" ADD CONSTRAINT "kycs_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
