-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");
