import { isAxiosError } from "axios";
import api from "@/api/axios";

export interface User {
  id: string | number;
  name: string;
  email: string;
  partnerEmail: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface Vendor {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  rating: number;
  averageRating: number;
  totalReviews: number;
  status: string;
  createdAt: string;
}

export interface Booking {
  id: string | number;
  userId: string | number;
  userEmail: string;
  userName: string;
  bookedByName?: string;
  vendorId: string | number;
  vendorEmail: string;
  vendorName: string;
  serviceId: string | number;
  service: string;
  eventDate: string;
  amount: number;
  status: string;
  createdAt: string;
  userRatingId: string;
  userRating: number;
  userReview: string;
  userReviewStatus: ReviewStatus | "";
}

export type BookingStatus = "pending" | "approved" | "in_progress" | "rejected" | "completed" | "cancelled";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface AdminReview {
  id: string;
  userId: string;
  author: string;
  primaryUserName: string;
  partnerName: string;
  serviceId: string;
  serviceName: string;
  vendorId: string;
  vendorName: string;
  rating: number;
  review: string;
  createdAt: string;
  status: ReviewStatus;
}

export interface VendorFormData {
  name: string;
  email: string;
  phone: string;
  category: string;
  location: string;
  password?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalBookings: number;
  totalRevenue: number;
  pendingUsers: number;
  inactiveUsers: number;
  rejectedUsers: number;
  pendingVendors: number;
  rejectedVendors: number;
  pendingBookings: number;
  rejectedBookings: number;
}

export interface AdminProfile {
  name: string;
  email: string;
  role: string;
}

export type ContactInquiryStatus = "new" | "contacted" | "archived";

export interface ContactInquiry {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  venue: string;
  message: string;
  status: ContactInquiryStatus;
  source: string;
  isRegisteredUser: boolean;
  accountType: "registered_user" | "new_user";
  userRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInquiryReplyPayload {
  subject: string;
  message: string;
}

export const vendorCategories: string[] = [
  "Catering", 
  "Decoration",
  "Florist",
  "Jewelry",
  "Makeup & Hair Styling", 
  "Music & DJ", 
  "Photography", 
  "Transportation", 
  "Venue", 
  "Wedding Cake",
];

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

const normalizeVendor = (vendor: Partial<Vendor>): Vendor => ({
  id: vendor.id ?? "",
  name: String(vendor.name || ""),
  email: String(vendor.email || "").trim().toLowerCase(),
  phone: String(vendor.phone || ""),
  category: String(vendor.category || ""),
  location: String(vendor.location || ""),
  rating: Number(vendor.averageRating || (vendor as Partial<{ average_rating: number }>).average_rating || vendor.rating || 0),
  averageRating: Number(
    vendor.averageRating || (vendor as Partial<{ average_rating: number }>).average_rating || vendor.rating || 0,
  ),
  totalReviews: Number(
    vendor.totalReviews || (vendor as Partial<{ total_reviews: number }>).total_reviews || 0,
  ),
  status: String(vendor.status || "pending"),
  createdAt: String(vendor.createdAt || ""),
});

type RawUser = Partial<User> & {
  partner_email?: string;
};

const normalizeUser = (user: RawUser): User => ({
  id: user.id ?? "",
  name: String(user.name || ""),
  email: String(user.email || "").trim().toLowerCase(),
  partnerEmail: String(user.partnerEmail || user.partner_email || "").trim().toLowerCase(),
  phone: String(user.phone || ""),
  role: String(user.role || ""),
  status: String(user.status || "pending"),
  createdAt: String(user.createdAt || ""),
});

type RawBooking = Partial<Booking> & {
  serviceName?: string;
  serviceType?: string;
  service_id?: string | number;
  clientEmail?: string;
  bookedByName?: string;
  booked_by_name?: string;
  userRatingId?: string | number;
  user_rating_id?: string | number;
  user_rating?: number;
  user_review?: string;
  userReviewStatus?: string;
  user_rating_status?: string;
};

const normalizeBookingStatus = (status: unknown): BookingStatus => {
  const normalizedStatus = String(status || "").trim().toLowerCase().replace(/[-_]+/g, " ");

  switch (normalizedStatus) {
    case "approved":
    case "confirmed":
      return "approved";
    case "in progress":
    case "inprogress":
      return "in_progress";
    case "rejected":
      return "rejected";
    case "completed":
      return "completed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
};

const normalizeReviewStatus = (status: unknown): ReviewStatus | "" => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "";
  }
};

const normalizeBooking = (booking: RawBooking): Booking => ({
  id: booking.id ?? "",
  userId: booking.userId ?? "",
  userEmail: String(booking.userEmail || booking.clientEmail || booking.userId || "").trim(),
  userName: String(
    booking.bookedByName || booking.booked_by_name || booking.userName || "",
  ).trim(),
  bookedByName: String(
    booking.bookedByName || booking.booked_by_name || booking.userName || "",
  ).trim(),
  vendorId: booking.vendorId ?? "",
  vendorEmail: String(booking.vendorEmail || "").trim().toLowerCase(),
  vendorName: String(booking.vendorName || ""),
  serviceId: booking.serviceId ?? booking.service_id ?? "",
  service: String(booking.service || booking.serviceName || booking.serviceType || "").trim(),
  eventDate: String(booking.eventDate || ""),
  amount: Number(booking.amount || 0),
  status: normalizeBookingStatus(booking.status),
  createdAt: String(booking.createdAt || ""),
  userRatingId: String(booking.userRatingId || booking.user_rating_id || "").trim(),
  userRating: Number(booking.userRating || booking.user_rating || 0),
  userReview: String(booking.userReview || booking.user_review || "").trim(),
  userReviewStatus: normalizeReviewStatus(
    booking.userReviewStatus || booking.user_rating_status,
  ),
});

type RawContactInquiry = Partial<ContactInquiry> & {
  created_at?: string;
  updated_at?: string;
};

type RawAdminReview = Partial<AdminReview> & {
  userName?: string;
  user_id?: string;
  service_id?: string;
  service_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  reviewStatus?: string;
  review_status?: string;
  comment?: string;
  date?: string;
};

const normalizeContactInquiryStatus = (status: unknown): ContactInquiryStatus => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  switch (normalizedStatus) {
    case "contacted":
      return "contacted";
    case "archived":
      return "archived";
    default:
      return "new";
  }
};

const normalizeContactInquiry = (inquiry: RawContactInquiry): ContactInquiry => ({
  id: inquiry.id ?? "",
  name: String(inquiry.name || "").trim(),
  email: String(inquiry.email || "").trim().toLowerCase(),
  phone: String(inquiry.phone || "").trim(),
  eventDate: String(inquiry.eventDate || "").trim(),
  guestCount: String(inquiry.guestCount || "").trim(),
  venue: String(inquiry.venue || "").trim(),
  message: String(inquiry.message || "").trim(),
  status: normalizeContactInquiryStatus(inquiry.status),
  source: String(inquiry.source || "landing_contact_form").trim(),
  isRegisteredUser: Boolean(inquiry.isRegisteredUser),
  accountType: String(inquiry.accountType || (inquiry.isRegisteredUser ? "registered_user" : "new_user")).trim() === "registered_user"
    ? "registered_user"
    : "new_user",
  userRole: String(inquiry.userRole || "").trim().toLowerCase(),
  createdAt: String(inquiry.createdAt || inquiry.created_at || "").trim(),
  updatedAt: String(inquiry.updatedAt || inquiry.updated_at || "").trim(),
});

const normalizeAdminReview = (review: RawAdminReview): AdminReview => ({
  id: String(review.id || "").trim(),
  userId: String(review.userId || review.user_id || "").trim(),
  author: String(review.author || review.userName || "User").trim() || "User",
  primaryUserName: String(review.primaryUserName || review.author || review.userName || "User").trim() || "User",
  partnerName: String(review.partnerName || "").trim(),
  serviceId: String(review.serviceId || review.service_id || "").trim(),
  serviceName: String(review.serviceName || review.service_name || "Service").trim() || "Service",
  vendorId: String(review.vendorId || review.vendor_id || "").trim(),
  vendorName: String(review.vendorName || review.vendor_name || "Vendor").trim() || "Vendor",
  rating: Number(review.rating || 0),
  review: String(review.review || review.comment || "").trim(),
  createdAt: String(review.createdAt || review.date || "").trim(),
  status: (normalizeReviewStatus(
    review.reviewStatus || review.review_status || review.status,
  ) || "approved") as ReviewStatus,
});

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const { data } = await api.get<Partial<DashboardStats>>("/admin/dashboard-stats");
    return {
      totalUsers: Number(data.totalUsers || 0),
      totalVendors: Number(data.totalVendors || 0),
      totalBookings: Number(data.totalBookings || 0),
      totalRevenue: Number(data.totalRevenue || 0),
      pendingUsers: Number(data.pendingUsers || 0),
      inactiveUsers: Number(data.inactiveUsers || 0),
      rejectedUsers: Number(data.rejectedUsers || 0),
      pendingVendors: Number(data.pendingVendors || 0),
      rejectedVendors: Number(data.rejectedVendors || 0),
      pendingBookings: Number(data.pendingBookings || 0),
      rejectedBookings: Number(data.rejectedBookings || 0),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load dashboard stats."));
  }
};

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data } = await api.get<Partial<User>[]>("/admin/users");
    return Array.isArray(data) ? data.map(normalizeUser) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load users."));
  }
};

export const updateUserStatus = async (userId: string | number, status: string): Promise<User> => {
  try {
    const { data } = await api.patch<Partial<User>>(`/admin/users/${userId}/status`, { status });
    return normalizeUser(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update user status."));
  }
};

export const deleteUser = async (userId: string | number): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success?: boolean }>(`/admin/users/${userId}`);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete user."));
  }
};

export const fetchVendors = async (): Promise<Vendor[]> => {
  try {
    const { data } = await api.get<Partial<Vendor>[]>("/admin/vendors");
    return Array.isArray(data) ? data.map(normalizeVendor) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load vendors."));
  }
};

export const createVendor = async (vendorData: VendorFormData): Promise<Vendor> => {
  try {
    const { data } = await api.post<Partial<Vendor>>("/admin/vendors", vendorData);
    return normalizeVendor(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create vendor."));
  }
};

export const updateVendor = async (
  vendorId: string | number,
  vendorData: Partial<VendorFormData>,
): Promise<Vendor> => {
  try {
    const { data } = await api.put<Partial<Vendor>>(`/admin/vendors/${vendorId}`, vendorData);
    return normalizeVendor(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update vendor."));
  }
};

export const deleteVendor = async (vendorId: string | number): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success?: boolean }>(`/admin/vendors/${vendorId}`);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete vendor."));
  }
};

export const updateVendorStatus = async (
  vendorId: string | number,
  status: string,
): Promise<Vendor> => {
  try {
    const { data } = await api.patch<Partial<Vendor>>(`/admin/vendors/${vendorId}/status`, { status });
    return normalizeVendor(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update vendor status."));
  }
};

export const fetchBookings = async (): Promise<Booking[]> => {
  try {
    const { data } = await api.get<Partial<Booking>[]>("/admin/bookings");
    return Array.isArray(data) ? data.map(normalizeBooking) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load bookings."));
  }
};

export const updateBookingStatus = async (
  bookingId: string | number,
  status: BookingStatus,
): Promise<Booking> => {
  try {
    const { data } = await api.patch<Partial<Booking>>(
      `/admin/bookings/${bookingId}/status`,
      { status },
    );
    return normalizeBooking(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update booking status."));
  }
};

export const deleteBooking = async (
  bookingId: string | number,
): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success?: boolean }>(`/admin/bookings/${bookingId}`);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete booking."));
  }
};

export const updateRatingStatus = async (
  reviewId: string | number,
  status: ReviewStatus,
): Promise<{ success: boolean; status: ReviewStatus }> => {
  try {
    const { data } = await api.patch<{
      success?: boolean;
      rating?: {
        status?: string;
        reviewStatus?: string;
        review_status?: string;
      };
    }>(`/admin/ratings/${reviewId}/status`, { status });

    return {
      success: Boolean(data.success),
      status:
        normalizeReviewStatus(
          data.rating?.reviewStatus || data.rating?.review_status || data.rating?.status,
        ) || status,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update review status."));
  }
};

export const fetchReviews = async (): Promise<AdminReview[]> => {
  try {
    const { data } = await api.get<RawAdminReview[]>("/admin/ratings");
    return Array.isArray(data) ? data.map(normalizeAdminReview) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load reviews."));
  }
};

export const deleteReview = async (
  reviewId: string | number,
): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success?: boolean }>(`/admin/ratings/${reviewId}`);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete review."));
  }
};

export const fetchContactInquiries = async (): Promise<ContactInquiry[]> => {
  try {
    const { data } = await api.get<RawContactInquiry[]>("/admin/contact-inquiries");
    return Array.isArray(data) ? data.map(normalizeContactInquiry) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load contact inquiries."));
  }
};

export const updateContactInquiryStatus = async (
  inquiryId: string | number,
  status: ContactInquiryStatus,
): Promise<ContactInquiry> => {
  try {
    const { data } = await api.patch<RawContactInquiry>(`/admin/contact-inquiries/${inquiryId}/status`, {
      status,
    });
    return normalizeContactInquiry(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update inquiry status."));
  }
};

export const deleteContactInquiry = async (
  inquiryId: string | number,
): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success?: boolean }>(`/admin/contact-inquiries/${inquiryId}`);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete inquiry."));
  }
};

export const sendContactInquiryReply = async (
  inquiryId: string | number,
  payload: ContactInquiryReplyPayload,
): Promise<ContactInquiry> => {
  try {
    const { data } = await api.post<RawContactInquiry>(
      `/admin/contact-inquiries/${inquiryId}/reply`,
      {
        subject: String(payload.subject || "").trim(),
        message: String(payload.message || "").trim(),
      },
    );
    return normalizeContactInquiry(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to send reply email."));
  }
};

export const fetchAdminProfile = async (): Promise<AdminProfile> => {
  try {
    const { data } = await api.get<Partial<AdminProfile>>("/admin/profile");
    return {
      name: String(data.name || "Admin User"),
      email: String(data.email || "admin@elegance.com").trim().toLowerCase(),
      role: String(data.role || "admin"),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load admin profile."));
  }
};

export const updateAdminProfile = async (payload: {
  name: string;
  email: string;
}): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.put<{ success?: boolean }>("/admin/profile", payload);
    return { success: Boolean(data.success) };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update admin profile."));
  }
};
