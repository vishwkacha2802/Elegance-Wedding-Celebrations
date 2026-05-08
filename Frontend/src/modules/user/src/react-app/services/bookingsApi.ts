import { isAxiosError } from "axios";

import api from "@/api/axios";

export type BookingStatus = "pending" | "approved" | "in_progress" | "rejected" | "completed" | "cancelled";
export type RatingReviewStatus = "pending" | "approved" | "rejected" | "";

export interface UserBooking {
  id: string;
  requestId: string;
  vendorId: string;
  serviceId: string;
  bookedByName: string;
  bookedBy: string;
  bookedByEmail: string;
  bookedByLabel: string;
  registeredEmail: string;
  registeredName: string;
  partnerEmail: string;
  partnerName: string;
  vendorName: string;
  businessName: string;
  service: string;
  location: string;
  eventDate: string;
  guestCount: number;
  estimatedBudget: number;
  notes: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  canRate: boolean;
  userRatingId: string;
  userRating: number;
  userReview: string;
  userRatingStatus: RatingReviewStatus;
  serviceAverageRating: number;
  serviceTotalReviews: number;
  vendorAverageRating: number;
  vendorTotalReviews: number;
}

type RawUserBooking = Partial<UserBooking> & {
  bookingId?: string;
  vendor_id?: string | number;
  service_id?: string | number;
  booked_by?: string;
  bookedByName?: string;
  booked_by_name?: string;
  bookedByEmail?: string;
  booked_by_email?: string;
  bookedByLabel?: string;
  booked_by_label?: string;
  registeredEmail?: string;
  registered_email?: string;
  registeredName?: string;
  registered_name?: string;
  partnerEmail?: string;
  partner_email?: string;
  partnerName?: string;
  partner_name?: string;
  userName?: string;
  user_name?: string;
  clientName?: string;
  client_name?: string;
  primaryUserName?: string;
  business_name?: string;
  userRatingId?: string;
  user_rating_id?: string;
  user_rating?: number;
  user_review?: string;
  userRatingStatus?: string;
  user_rating_status?: string;
  can_rate?: boolean;
  service_average_rating?: number;
  service_total_reviews?: number;
  vendor_average_rating?: number;
  vendor_total_reviews?: number;
};

const BOOKING_STATUS_ALIASES: Record<string, BookingStatus> = {
  pending: "pending",
  submitted: "pending",
  approved: "approved",
  confirmed: "approved",
  "in progress": "in_progress",
  inprogress: "in_progress",
  rejected: "rejected",
  completed: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

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

export const toBookingStatus = (value: unknown): BookingStatus => {
  const normalizedStatus = String(value || "").trim().toLowerCase();
  return BOOKING_STATUS_ALIASES[normalizedStatus] || "pending";
};

const toRatingReviewStatus = (value: unknown): RatingReviewStatus => {
  const normalizedStatus = String(value || "").trim().toLowerCase();
  if (normalizedStatus === "pending" || normalizedStatus === "approved" || normalizedStatus === "rejected") {
    return normalizedStatus;
  }
  return "";
};

const toUserBooking = (booking: RawUserBooking): UserBooking => {
  const bookingId = String(
    booking.id || booking.requestId || booking.bookingId || "",
  ).trim();

  return {
    id: bookingId,
    requestId: String(booking.requestId || bookingId).trim(),
    vendorId: String(booking.vendorId || booking.vendor_id || "").trim(),
    serviceId: String(booking.serviceId || booking.service_id || "").trim(),
    bookedByName: String(booking.bookedByName || booking.booked_by_name || "").trim(),
    bookedBy: String(
      booking.bookedByName ||
        booking.booked_by_name ||
      booking.bookedBy ||
        booking.booked_by ||
        booking.userName ||
        booking.user_name ||
        booking.clientName ||
        booking.client_name ||
        booking.primaryUserName ||
        booking.registeredName ||
        "",
    ).trim(),
    bookedByEmail: String(booking.bookedByEmail || booking.booked_by_email || "").trim().toLowerCase(),
    bookedByLabel: String(booking.bookedByLabel || booking.booked_by_label || "").trim(),
    registeredEmail: String(booking.registeredEmail || booking.registered_email || "").trim().toLowerCase(),
    registeredName: String(booking.registeredName || booking.registered_name || "").trim(),
    partnerEmail: String(booking.partnerEmail || booking.partner_email || "").trim().toLowerCase(),
    partnerName: String(booking.partnerName || booking.partner_name || "").trim(),
    vendorName: String(booking.vendorName || "").trim(),
    businessName: String(
      booking.businessName || booking.business_name || booking.service || booking.vendorName || "",
    ).trim(),
    service: String(booking.service || "").trim(),
    location: String(booking.location || "").trim(),
    eventDate: String(booking.eventDate || "").trim(),
    guestCount: Number(booking.guestCount || 0),
    estimatedBudget: Number(booking.estimatedBudget || 0),
    notes: String(booking.notes || "").trim(),
    status: toBookingStatus(booking.status),
    createdAt: String(booking.createdAt || ""),
    updatedAt: String(booking.updatedAt || booking.createdAt || ""),
    canRate: Boolean(booking.canRate ?? booking.can_rate ?? booking.vendorId ?? booking.vendor_id),
    userRatingId: String(booking.userRatingId || booking.user_rating_id || "").trim(),
    userRating: Number(booking.userRating || booking.user_rating || 0),
    userReview: String(booking.userReview || booking.user_review || "").trim(),
    userRatingStatus: toRatingReviewStatus(
      booking.userRatingStatus || booking.user_rating_status,
    ),
    serviceAverageRating: Number(
      booking.serviceAverageRating || booking.service_average_rating || 0,
    ),
    serviceTotalReviews: Number(
      booking.serviceTotalReviews || booking.service_total_reviews || 0,
    ),
    vendorAverageRating: Number(
      booking.vendorAverageRating || booking.vendor_average_rating || 0,
    ),
    vendorTotalReviews: Number(
      booking.vendorTotalReviews || booking.vendor_total_reviews || 0,
    ),
  };
};

export const fetchUserBookings = async (userEmail: string): Promise<UserBooking[]> => {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("User email is required.");
  }

  try {
    const { data } = await api.get<{ bookings?: RawUserBooking[] } | RawUserBooking[]>("/user/bookings", {
      params: { userEmail: normalizedEmail },
    });

    const bookings = Array.isArray(data) ? data : Array.isArray(data?.bookings) ? data.bookings : [];
    return bookings.map(toUserBooking);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load booking requests."));
  }
};

export const updateUserBookingNotes = async (
  bookingId: string,
  payload: { userEmail: string; notes: string },
) => {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedEmail = String(payload.userEmail || "").trim().toLowerCase();
  if (!normalizedBookingId) {
    throw new Error("Booking id is required.");
  }
  if (!normalizedEmail) {
    throw new Error("User email is required.");
  }

  try {
    const { data } = await api.patch<{ success?: boolean; updatedAt?: string }>(
      `/user/bookings/${normalizedBookingId}/notes`,
      {
        userEmail: normalizedEmail,
        notes: String(payload.notes || "").trim(),
      },
    );

    return {
      success: Boolean(data?.success),
      updatedAt: String(data?.updatedAt || ""),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update booking notes."));
  }
};

export const updateUserBooking = async (
  bookingId: string,
  payload: Pick<UserBooking, "eventDate" | "location" | "guestCount" | "estimatedBudget" | "notes"> & {
    userEmail: string;
  },
) => {
  const normalizedBookingId = String(bookingId || "").trim();
  const normalizedEmail = String(payload.userEmail || "").trim().toLowerCase();
  if (!normalizedBookingId) {
    throw new Error("Booking id is required.");
  }
  if (!normalizedEmail) {
    throw new Error("User email is required.");
  }
  if (!String(payload.eventDate || "").trim()) {
    throw new Error("Event date is required.");
  }

  try {
    const { data } = await api.patch<{
      success?: boolean;
      updatedAt?: string;
      booking?: Partial<UserBooking>;
    }>(
      `/user/bookings/${normalizedBookingId}`,
      {
        userEmail: normalizedEmail,
        eventDate: String(payload.eventDate || "").trim(),
        location: String(payload.location || "").trim(),
        guestCount: Number(payload.guestCount || 0),
        estimatedBudget: Number(payload.estimatedBudget || 0),
        notes: String(payload.notes || "").trim(),
      },
    );

    return {
      success: Boolean(data?.success),
      updatedAt: String(data?.updatedAt || ""),
      booking: data?.booking || {},
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update booking request."));
  }
};
