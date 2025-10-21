import { IsString, IsNumber, IsEnum, IsArray, IsOptional, IsDecimal, IsBoolean } from 'class-validator';
import { FuelType, TransmissionType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  brand!: string;

  @IsString()
  model!: string;

  @IsNumber()
  year!: number;

  @IsString()
  color!: string;

  @IsString()
  licensePlate!: string;

  @IsString()
  engineSize!: string;

  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsEnum(TransmissionType)
  transmission!: TransmissionType;

  @IsArray()
  @IsString({ each: true })
  features!: string[];

  @IsDecimal()
  latitude!: number;

  @IsDecimal()
  longitude!: number;

  @IsString()
  address!: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsString()
  ward!: string;

  @IsDecimal()
  pricePerHour!: number;

  @IsDecimal()
  pricePerDay!: number;

  @IsDecimal()
  deposit!: number;

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  engineSize?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsDecimal()
  latitude?: number;

  @IsOptional()
  @IsDecimal()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsDecimal()
  pricePerHour?: number;

  @IsOptional()
  @IsDecimal()
  pricePerDay?: number;

  @IsOptional()
  @IsDecimal()
  deposit?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class SearchVehiclesDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsDecimal()
  minPrice?: number;

  @IsOptional()
  @IsDecimal()
  maxPrice?: number;

  @IsOptional()
  @IsDecimal()
  latitude?: number;

  @IsOptional()
  @IsDecimal()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  radius?: number; // in kilometers

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
