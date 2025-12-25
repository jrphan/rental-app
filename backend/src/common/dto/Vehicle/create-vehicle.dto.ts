import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LicenseType } from '@prisma/client';

class VehicleImageDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateVehicleDto {
  @IsString()
  type: string;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @Type(() => Number)
  year: number;

  @IsString()
  color: string;

  @IsString()
  licensePlate: string;

  @IsNumber()
  @Min(50)
  @Max(10000)
  @Type(() => Number)
  engineSize: number;

  @IsOptional()
  @IsEnum(LicenseType)
  requiredLicense?: LicenseType;

  @IsOptional()
  @IsString()
  cavetFront?: string;

  @IsOptional()
  @IsString()
  cavetBack?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 hình ảnh' })
  @ArrayMaxSize(10, { message: 'Tối đa 10 hình ảnh' })
  @ValidateNested({ each: true })
  @Type(() => VehicleImageDto)
  images: VehicleImageDto[];

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsLatitude()
  @Type(() => Number)
  lat: number;

  @IsLongitude()
  @Type(() => Number)
  lng: number;

  @IsNumber()
  @Min(1)
  @Max(100000000)
  @Type(() => Number)
  pricePerDay: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500000000)
  @Type(() => Number)
  depositAmount?: number;

  @IsOptional()
  @IsBoolean()
  instantBook?: boolean;
}
