import { IsEnum } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class ChangeVehicleStatusDto {
  @IsEnum(VehicleStatus, {
    message: 'Trạng thái không hợp lệ',
  })
  status: VehicleStatus;
}
