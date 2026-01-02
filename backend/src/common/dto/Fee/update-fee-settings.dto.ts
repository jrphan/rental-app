import { IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFeeSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deliveryFeePerKm: number; // VND per km

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRate50cc: number; // VND per day

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRateTayGa: number; // VND per day

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRateTayCon: number; // VND per day

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRateMoto: number; // VND per day

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  insuranceRateDefault?: number; // VND per day (optional, default 30000)

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  insuranceCommissionRatio: number; // 0.20 = 20% hoa hồng nền tảng
}

