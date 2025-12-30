import { apiClient } from "@/lib/api";
import API_ENDPOINTS from "./api.endpoints";

export interface Review {
  id: string;
  rentalId: string;
  type: "RENTER_TO_VEHICLE" | "OWNER_TO_RENTER";
  authorId: string;
  revieweeId: string;
  vehicleId?: string;
  rating: number;
  content?: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName?: string;
    avatar?: string;
  };
}

export interface VehicleReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface CreateReviewRequest {
  rentalId: string;
  type: "RENTER_TO_VEHICLE" | "OWNER_TO_RENTER";
  rating: number;
  content?: string;
}

export interface CreateReviewResponse {
  message: string;
  review: Review;
}

export const apiReview = {
  async getVehicleReviews(vehicleId: string): Promise<VehicleReviewsResponse> {
    const response = await apiClient.get<VehicleReviewsResponse>(
      API_ENDPOINTS.VEHICLE.GET_VEHICLE_REVIEWS.replace(":id", vehicleId)
    );
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy đánh giá thất bại");
  },

  async createReview(data: CreateReviewRequest): Promise<CreateReviewResponse> {
    const { rentalId, ...rest } = data;
    const url = API_ENDPOINTS.REVIEW.CREATE.replace(":id", rentalId);
    const response = await apiClient.post<CreateReviewResponse>(url, rest);
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Tạo đánh giá thất bại");
  },

  async getRentalReviews(rentalId: string): Promise<{
    reviews: Review[];
    userHasReviewed: boolean;
  }> {
    const url = API_ENDPOINTS.REVIEW.GET_RENTAL_REVIEWS.replace(":id", rentalId);
    const response = await apiClient.get<{
      reviews: Review[];
      userHasReviewed: boolean;
    }>(url);
    if (response.success && response.data && !Array.isArray(response.data)) {
      return response.data;
    }
    throw new Error(response.message || "Lấy đánh giá thất bại");
  },
};

