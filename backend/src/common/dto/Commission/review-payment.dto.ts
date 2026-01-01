import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CommissionPaymentStatus } from '@prisma/client';

export class ReviewPaymentDto {
  @IsEnum(CommissionPaymentStatus)
  status: CommissionPaymentStatus; // APPROVED hoặc REJECTED

  @IsOptional()
  @IsString()
  adminNotes?: string; // Ghi chú từ admin
}
