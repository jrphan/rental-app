import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  IsObject,
} from 'class-validator';

export class CreateRentalDto {
  @IsString()
  vehicleId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  // Optional delivery options payload (address + coords)
  @IsOptional()
  @IsObject()
  deliveryAddress?: Record<string, any>;
}
