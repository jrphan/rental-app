import { Prisma } from '@prisma/client';

export const selectRental = {
  id: true,
  renterId: true,
  ownerId: true,
  vehicleId: true,
  startDate: true,
  endDate: true,
  durationMinutes: true,
  currency: true,
  pricePerDay: true,
  deliveryFee: true,
  insuranceFee: true,
  discountAmount: true,
  deliveryAddress: true,
  totalPrice: true,
  depositPrice: true,
  platformFeeRatio: true,
  platformFee: true,
  ownerEarning: true,
  status: true,
  startOdometer: true,
  endOdometer: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  renter: {
    select: {
      id: true,
      phone: true,
      email: true,
      fullName: true,
      avatar: true,
    },
  },
  owner: {
    select: {
      id: true,
      phone: true,
      email: true,
      fullName: true,
      avatar: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      color: true,
      licensePlate: true,
      engineSize: true,
      images: {
        select: {
          id: true,
          url: true,
          isPrimary: true,
          order: true,
        },
        orderBy: {
          order: 'asc' as Prisma.SortOrder,
        },
      },
      pricePerDay: true,
      depositAmount: true,
      fullAddress: true,
      address: true,
      ward: true,
      district: true,
      city: true,
      lat: true,
      lng: true,
    },
  },
  evidences: {
    select: {
      id: true,
      url: true,
      type: true,
      order: true,
      note: true,
      createdAt: true,
    },
    orderBy: {
      order: 'asc' as Prisma.SortOrder,
    },
  },
  dispute: {
    select: {
      id: true,
      rentalId: true,
      reason: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.RentalSelect;

export type RentalResponse = Prisma.RentalGetPayload<{
  select: typeof selectRental;
}>;

export interface CreateRentalResponse {
  message: string;
  rental: RentalResponse;
}

export interface RentalListResponse {
  rentals: RentalResponse[];
  total: number;
}

export interface RentalDetailResponse {
  rental: RentalResponse;
}

export interface UpdateRentalStatusResponse {
  message: string;
  rental: RentalResponse;
}

// Admin types
export const selectAdminRental = {
  id: true,
  renterId: true,
  ownerId: true,
  vehicleId: true,
  startDate: true,
  endDate: true,
  durationMinutes: true,
  currency: true,
  pricePerDay: true,
  deliveryFee: true,
  insuranceFee: true,
  discountAmount: true,
  deliveryAddress: true,
  totalPrice: true,
  depositPrice: true,
  platformFeeRatio: true,
  platformFee: true,
  ownerEarning: true,
  status: true,
  startOdometer: true,
  endOdometer: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  renter: {
    select: {
      id: true,
      phone: true,
      email: true,
      fullName: true,
      avatar: true,
    },
  },
  owner: {
    select: {
      id: true,
      phone: true,
      email: true,
      fullName: true,
      avatar: true,
    },
  },
  vehicle: {
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      color: true,
      licensePlate: true,
      engineSize: true,
      images: {
        select: {
          id: true,
          url: true,
          isPrimary: true,
          order: true,
        },
        orderBy: {
          order: 'asc' as Prisma.SortOrder,
        },
      },
      pricePerDay: true,
      depositAmount: true,
      fullAddress: true,
      address: true,
      ward: true,
      district: true,
      city: true,
      lat: true,
      lng: true,
    },
  },
  evidences: {
    select: {
      id: true,
      url: true,
      type: true,
      order: true,
      note: true,
      createdAt: true,
    },
    orderBy: {
      order: 'asc' as Prisma.SortOrder,
    },
  },
  dispute: {
    select: {
      id: true,
      rentalId: true,
      reason: true,
      description: true,
      status: true,
      adminNotes: true,
      resolvedBy: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  transactions: {
    select: {
      id: true,
      type: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc' as Prisma.SortOrder,
    },
  },
} satisfies Prisma.RentalSelect;

export type AdminRentalItem = Prisma.RentalGetPayload<{
  select: typeof selectAdminRental;
}>;

export interface AdminRentalListResponse {
  items: AdminRentalItem[];
  total: number;
  page: number;
  limit: number;
}

export type AdminRentalDetailResponse = AdminRentalItem;
