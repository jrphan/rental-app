import { IsEnum, IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { EvidenceType } from '@prisma/client';

export class UploadEvidenceDto {
  @IsEnum(EvidenceType)
  type: EvidenceType;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  order?: number;
}

export class UploadMultipleEvidenceDto {
  @IsArray()
  evidences: {
    type: EvidenceType;
    url: string;
    note?: string;
    order?: number;
  }[];
}
