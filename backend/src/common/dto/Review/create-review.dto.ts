import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReviewType } from '@prisma/client';

export class CreateReviewDto {
  @IsEnum(ReviewType)
  type: ReviewType;

  @IsInt()
  @Min(1, { message: 'Rating phải từ 1 đến 5' })
  @Max(5, { message: 'Rating phải từ 1 đến 5' })
  rating: number;

  @IsOptional()
  @IsString()
  content?: string;
}

