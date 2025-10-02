// Review types from Prisma schema
export type Review = {
  id: string;
  bookingId: string;
  userId: string;
  vehicleId: string;
  ownerId: string;
  overallRating: number;
  cleanlinessRating: number;
  communicationRating: number;
  valueRating: number;
  conditionRating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  ownerResponse: string | null;
  ownerResponseAt: Date | null;
  isPublished: boolean;
  isVerified: boolean;
  isHelpful: number;
  isNotHelpful: number;
  isFlagged: boolean;
  flagReason: string | null;
  moderatedAt: Date | null;
  moderatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReviewHelpfulVote = {
  id: string;
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: Date;
};
