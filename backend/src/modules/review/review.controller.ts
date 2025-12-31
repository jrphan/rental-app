import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReviewService } from './review.service';
import { CreateReviewDto } from '@/common/dto/Review/create-review.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthenticatedRequest } from '@/types/response.type';
import { ROUTES } from '@/config/routes';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(ROUTES.REVIEW.CREATE)
  @UseGuards(AuthGuard)
  async createReview(
    @Param('id') rentalId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: Request,
  ) {
    const authorId = (req as AuthenticatedRequest).user?.sub;
    if (!authorId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.reviewService.createReview(rentalId, authorId, dto);
  }

  @Get(ROUTES.REVIEW.GET_RENTAL_REVIEWS)
  @UseGuards(AuthGuard)
  async getRentalReviews(@Param('id') rentalId: string, @Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    return this.reviewService.getRentalReviews(rentalId, userId);
  }

  @Delete(ROUTES.REVIEW.DELETE)
  @UseGuards(AuthGuard)
  async deleteReview(@Param('id') reviewId: string, @Req() req: Request) {
    const userId = (req as AuthenticatedRequest).user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return this.reviewService.deleteReview(reviewId, userId);
  }
}
