import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;
}
