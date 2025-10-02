import { PaymentStatus } from "./payment";

// Booking types from Prisma schema
export type Booking = {
  id: string;
  userId: string;
  vehicleId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalHours: number | null;
  pricePerDay: number;
  pricePerHour: number | null;
  totalAmount: number;
  deposit: number | null;
  fees: any | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  pickupLocation: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLocation: string | null;
  dropoffAddress: string | null;
  dropoffLatitude: number | null;
  dropoffLongitude: number | null;
  deliveryFee: number | null;
  insuranceFee: number | null;
  additionalDriverFee: number | null;
  confirmedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
  specialRequests: string | null;
  cancellationReason: string | null;
  refundAmount: number | null;
  refundedAt: Date | null;
};

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

