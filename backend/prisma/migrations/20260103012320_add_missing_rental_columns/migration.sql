/*
  Warnings:

  - Added the required column `platformEarning` to the `rentals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rentals" ADD COLUMN     "insuranceCommissionAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "insuranceCommissionRatio" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
ADD COLUMN     "insurancePayableToPartner" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformEarning" DECIMAL(15,2) NOT NULL;

-- CreateTable
CREATE TABLE "fee_settings" (
    "id" TEXT NOT NULL,
    "deliveryFeePerKm" DECIMAL(10,2) NOT NULL,
    "insuranceRate50cc" DECIMAL(10,2) NOT NULL DEFAULT 20000,
    "insuranceRateTayGa" DECIMAL(10,2) NOT NULL DEFAULT 30000,
    "insuranceRateTayCon" DECIMAL(10,2) NOT NULL DEFAULT 50000,
    "insuranceRateMoto" DECIMAL(10,2) NOT NULL DEFAULT 50000,
    "insuranceRateDefault" DECIMAL(10,2) NOT NULL DEFAULT 30000,
    "insuranceCommissionRatio" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_settings_pkey" PRIMARY KEY ("id")
);
