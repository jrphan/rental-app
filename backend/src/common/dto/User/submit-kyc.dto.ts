import { IsOptional, IsString, IsEnum } from 'class-validator';
import { LicenseType } from '@prisma/client';

export class SubmitKycDto {
  @IsOptional()
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsString()
  fullNameInId?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  addressInId?: string;

  @IsOptional()
  @IsString()
  driverLicense?: string;

  @IsOptional()
  @IsEnum(LicenseType)
  licenseType?: LicenseType;

  @IsOptional()
  @IsString()
  idCardFront?: string;

  @IsOptional()
  @IsString()
  idCardBack?: string;

  @IsOptional()
  @IsString()
  licenseFront?: string;

  @IsOptional()
  @IsString()
  licenseBack?: string;

  @IsOptional()
  @IsString()
  selfieImg?: string;
}
