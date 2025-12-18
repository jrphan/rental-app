import { IsString, IsOptional, IsIn } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @IsString()
  @IsOptional()
  deviceId?: string;
}

