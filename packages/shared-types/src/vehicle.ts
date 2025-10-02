// Vehicle types from Prisma schema
export type Vehicle = {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  vin: string | null;
  mileage: number | null;
  fuelType: FuelType;
  transmission: Transmission;
  engineSize: number | null;
  seats: number;
  doors: number;
  features: string[];
  images: string[];
  documents: string[];
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  pricePerDay: number;
  pricePerHour: number | null;
  deposit: number | null;
  status: VehicleStatus;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  insuranceExpiry: Date | null;
  registrationExpiry: Date | null;
  inspectionExpiry: Date | null;
};

export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';

export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUGIN_HYBRID';

export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'CVT';

export type MaintenanceLog = {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number | null;
  mileage: number | null;
  performedAt: Date;
  nextDueAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MaintenanceType = 
  | 'OIL_CHANGE' 
  | 'BRAKE_SERVICE' 
  | 'TIRE_CHANGE' 
  | 'ENGINE_SERVICE' 
  | 'TRANSMISSION_SERVICE' 
  | 'ELECTRICAL_SERVICE' 
  | 'BODY_REPAIR' 
  | 'INSPECTION' 
  | 'OTHER';

export type VehicleLocationHistory = {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  recordedAt: Date;
};
