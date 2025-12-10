-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'MAINTENANCE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('A1', 'A2', 'A3', 'A4');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING_PAYMENT', 'AWAIT_APPROVAL', 'CONFIRMED', 'ON_TRIP', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_UPDATE');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_NO_REFUND', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'PROMOTION', 'RENTAL_UPDATE', 'PAYMENT', 'KYC_UPDATE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'PAYMENT', 'REFUND', 'PAYOUT', 'PENALTY');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('RENTER_TO_VEHICLE', 'OWNER_TO_RENTER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN');

-- CreateEnum
CREATE TYPE "AuditTargetType" AS ENUM ('RENTAL', 'VEHICLE', 'USER', 'PAYMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('PICKUP_FRONT', 'PICKUP_BACK', 'PICKUP_LEFT', 'PICKUP_RIGHT', 'PICKUP_DASHBOARD', 'RETURN_FRONT', 'RETURN_BACK', 'RETURN_LEFT', 'RETURN_RIGHT', 'RETURN_DASHBOARD', 'DAMAGE_DETAIL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isVendor" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "stripeStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "citizenId" TEXT,
    "fullNameInId" TEXT,
    "dob" TIMESTAMP(3),
    "addressInId" TEXT,
    "driverLicense" TEXT,
    "licenseType" "LicenseType",
    "idCardFront" TEXT,
    "idCardBack" TEXT,
    "licenseFront" TEXT,
    "licenseBack" TEXT,
    "selfieImg" TEXT,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "engineSize" INTEGER NOT NULL,
    "requiredLicense" "LicenseType" NOT NULL DEFAULT 'A1',
    "cavetFront" TEXT,
    "cavetBack" TEXT,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "pricePerDay" DECIMAL(15,2) NOT NULL,
    "depositAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "instantBook" BOOLEAN NOT NULL DEFAULT false,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_images" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_unavailabilities" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "vehicle_unavailabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "pricePerDay" DECIMAL(15,2) NOT NULL,
    "deliveryFee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "depositPrice" DECIMAL(15,2) NOT NULL,
    "platformFeeRatio" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "platformFee" DECIMAL(15,2) NOT NULL,
    "ownerEarning" DECIMAL(15,2) NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startOdometer" INTEGER,
    "endOdometer" INTEGER,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_evidences" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "stripeIntentId" TEXT,
    "stripeTransferId" TEXT,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "adminNotes" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "type" "ReviewType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "content" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "targetId" TEXT,
    "targetType" "AuditTargetType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_userId_key" ON "kyc_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_citizenId_key" ON "kyc_records"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_driverLicense_key" ON "kyc_records"("driverLicense");

-- CreateIndex
CREATE INDEX "kyc_records_status_idx" ON "kyc_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_district_city_idx" ON "vehicles"("district", "city");

-- CreateIndex
CREATE INDEX "vehicles_lat_lng_idx" ON "vehicles"("lat", "lng");

-- CreateIndex
CREATE INDEX "vehicles_pricePerDay_idx" ON "vehicles"("pricePerDay");

-- CreateIndex
CREATE INDEX "vehicle_unavailabilities_vehicleId_startDate_endDate_idx" ON "vehicle_unavailabilities"("vehicleId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "rentals_renterId_idx" ON "rentals"("renterId");

-- CreateIndex
CREATE INDEX "rentals_ownerId_idx" ON "rentals"("ownerId");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_startDate_endDate_idx" ON "rentals"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripeIntentId_key" ON "transactions"("stripeIntentId");

-- CreateIndex
CREATE INDEX "transactions_rentalId_idx" ON "transactions"("rentalId");

-- CreateIndex
CREATE INDEX "transactions_stripeIntentId_idx" ON "transactions"("stripeIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_rentalId_key" ON "disputes"("rentalId");

-- CreateIndex
CREATE INDEX "reviews_vehicleId_idx" ON "reviews"("vehicleId");

-- CreateIndex
CREATE INDEX "reviews_revieweeId_idx" ON "reviews"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_rentalId_authorId_type_key" ON "reviews"("rentalId", "authorId", "type");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_targetType_idx" ON "audit_logs"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- AddForeignKey
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_unavailabilities" ADD CONSTRAINT "vehicle_unavailabilities_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_evidences" ADD CONSTRAINT "rental_evidences_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
