import { IsNumber, Min, Max } from 'class-validator';

export class UpdateCommissionSettingsDto {
  @IsNumber()
  @Min(0)
  @Max(1) // Max 100% = 1.0
  commissionRate: number; // 0.15 = 15%
}
