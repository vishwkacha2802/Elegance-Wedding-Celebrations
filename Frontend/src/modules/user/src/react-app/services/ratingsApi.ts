import { isAxiosError } from "axios";

import api from "@/api/axios";

export interface SubmitVendorRatingPayload {
  serviceId: string | number;
  rating: number;
  review?: string;
}

export interface SubmittedVendorRating {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  review: string;
  createdAt: string;
  status?: string;
  isMine: boolean;
}

export interface VendorRatingSummary {
  id: string;
  name: string;
  averageRating: number;
  totalReviews: number;
}

export interface SubmitVendorRatingResult {
  success: boolean;
  message: string;
  rating: SubmittedVendorRating | null;
  service: VendorRatingSummary;
  vendor: VendorRatingSummary;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; error?: string } | undefined;
    return responseData?.message || responseData?.error || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export async function submitVendorRating(
  payload: SubmitVendorRatingPayload,
): Promise<SubmitVendorRatingResult> {
  const serviceId = String(payload.serviceId || "").trim();
  const rating = Math.round(Number(payload.rating || 0));
  if (!serviceId) {
    throw new Error("Service id is required.");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("Please select a rating between 1 and 5.");
  }

  try {
    const { data } = await api.post<{
      success?: boolean;
      message?: string;
      rating?: {
        id?: string;
        userId?: string;
        user_id?: string;
        userName?: string;
        author?: string;
        rating?: number;
        review?: string;
        comment?: string;
        createdAt?: string;
        date?: string;
        status?: string;
        reviewStatus?: string;
        review_status?: string;
        isMine?: boolean;
      } | null;
      vendor?: {
        id?: string | number;
        name?: string;
        averageRating?: number;
        average_rating?: number;
        totalReviews?: number;
        total_reviews?: number;
      };
      service?: {
        id?: string | number;
        name?: string;
        averageRating?: number;
        average_rating?: number;
        totalReviews?: number;
        total_reviews?: number;
      };
    }>("/ratings", {
      serviceId,
      rating,
      review: String(payload.review || "").trim(),
    });

    const responseRating = data.rating || null;
    const responseVendor = data.vendor || {};
    const responseService = data.service || {};

    return {
      success: Boolean(data.success),
      message: String(data.message || "Service rating submitted for admin approval."),
      rating: responseRating
        ? {
            id: String(responseRating.id || ""),
            userId: String(responseRating.userId || responseRating.user_id || ""),
            userName: String(responseRating.userName || responseRating.author || "User"),
            rating: Number(responseRating.rating || 0),
            review: String(responseRating.review || responseRating.comment || ""),
            createdAt: String(responseRating.createdAt || responseRating.date || ""),
            status: String(
              responseRating.reviewStatus || responseRating.review_status || responseRating.status || "",
            ),
            isMine: Boolean(responseRating.isMine),
          }
        : null,
      service: {
        id: String(responseService.id || serviceId),
        name: String(responseService.name || "Service"),
        averageRating: Number(
          responseService.averageRating || responseService.average_rating || 0,
        ),
        totalReviews: Number(
          responseService.totalReviews || responseService.total_reviews || 0,
        ),
      },
      vendor: {
        id: String(responseVendor.id || ""),
        name: String(responseVendor.name || "Vendor"),
        averageRating: Number(
          responseVendor.averageRating || responseVendor.average_rating || 0,
        ),
        totalReviews: Number(
          responseVendor.totalReviews || responseVendor.total_reviews || 0,
        ),
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to submit service rating."));
  }
}
