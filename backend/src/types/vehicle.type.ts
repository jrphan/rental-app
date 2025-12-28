import { Prisma } from '@prisma/client';

export const selectVehicle = {
  id: true,
  ownerId: true,
  type: true,
  brand: true,
  model: true,
  year: true,
  color: true,
  licensePlate: true,
  engineSize: true,
  requiredLicense: true,
  cavetFront: true,
  cavetBack: true,
  description: true,
  fullAddress: true,
  address: true,
  district: true,
  ward: true,
  city: true,
  lat: true,
  lng: true,
  pricePerDay: true,
  depositAmount: true,
  instantBook: true,
  deliveryAvailable: true,
  deliveryBaseFee: true,
  deliveryFeePerKm: true,
  deliveryRadiusKm: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: {
      id: true,
      url: true,
      isPrimary: true,
      order: true,
    },
    orderBy: {
      order: 'asc' as const,
    },
  },
  owner: {
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      avatar: true,
    },
  },
} satisfies Prisma.VehicleSelect;

export type VehicleResponse = Prisma.VehicleGetPayload<{
  select: typeof selectVehicle;
}>;

export interface CreateVehicleResponse {
  message: string;
  vehicle: VehicleResponse;
}

export const selectAdminVehicle = {
  id: true,
  ownerId: true,
  type: true,
  brand: true,
  model: true,
  year: true,
  color: true,
  licensePlate: true,
  engineSize: true,
  requiredLicense: true,
  cavetFront: true,
  cavetBack: true,
  description: true,
  fullAddress: true,
  address: true,
  ward: true,
  district: true,
  city: true,
  lat: true,
  lng: true,
  pricePerDay: true,
  depositAmount: true,
  instantBook: true,
  deliveryAvailable: true,
  deliveryBaseFee: true,
  deliveryFeePerKm: true,
  deliveryRadiusKm: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: {
      id: true,
      url: true,
      isPrimary: true,
      order: true,
    },
    orderBy: {
      order: 'asc' as const,
    },
  },
  owner: {
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      isVendor: true,
    },
  },
} satisfies Prisma.VehicleSelect;

export type AdminVehicleItem = Prisma.VehicleGetPayload<{
  select: typeof selectAdminVehicle;
}>;

export interface AdminVehicleListResponse {
  items: AdminVehicleItem[];
  total: number;
  page: number;
  limit: number;
}

export type AdminVehicleDetailResponse = AdminVehicleItem;

export interface AdminVehicleActionResponse {
  message: string;
}

export interface UserVehicleListResponse {
  items: VehicleResponse[];
  total: number;
}
