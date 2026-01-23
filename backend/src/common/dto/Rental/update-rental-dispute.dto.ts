import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class UpdateRentalDisputeDto {
  @IsEnum(DisputeStatus)
  status: DisputeStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}


