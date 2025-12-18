import { IsString, MinLength } from 'class-validator';

export class RejectVehicleDto {
  @IsString()
  @MinLength(1, { message: 'Lý do từ chối không được để trống' })
  reason: string;
}
