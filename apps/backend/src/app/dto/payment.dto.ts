import { IsString, IsDecimal, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { PaymentType, PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  bookingId!: string;

  @IsDecimal()
  amount!: number;

  @IsEnum(PaymentType)
  type!: PaymentType;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  gatewayResponse?: string;
}

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
