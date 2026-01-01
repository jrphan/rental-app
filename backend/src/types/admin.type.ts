import { RentalStatus } from '@prisma/client';

export interface AdminStatsResponse {
  overview: {
    totalRevenue: string; // Total platform fees from completed rentals
    totalRentals: number;
    totalUsers: number;
    totalVehicles: number;
    activeRentals: number; // ON_TRIP status
    pendingRentals: number; // PENDING_PAYMENT + AWAIT_APPROVAL
    completedRentals: number;
    cancelledRentals: number;
    disputedRentals: number;
  };
  revenue: {
    today: string;
    thisWeek: string;
    thisMonth: string;
    lastMonth: string;
  };
  rentalsByStatus: Array<{
    status: RentalStatus;
    count: number;
  }>;
  revenueChart: Array<{
    date: string; // ISO date string
    revenue: string; // Decimal as string
    count: number;
  }>;
  recentRentals: Array<{
    id: string;
    renterName: string | null;
    vehicleName: string;
    totalPrice: string;
    status: RentalStatus;
    createdAt: string;
  }>;
  topVehicles: Array<{
    vehicleId: string;
    brand: string;
    model: string;
    licensePlate: string;
    rentalCount: number;
    totalRevenue: string;
  }>;
}

