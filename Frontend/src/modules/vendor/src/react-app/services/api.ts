import { isAxiosError } from "axios";
import api from "@/api/axios";

export interface VendorProfile {
  businessName: string;
  ownerName: string;
  category: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface VendorStats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  currentMonthBookings: number;
  lastMonthBookings: number;
  currentMonthApprovedBookings: number;
  lastMonthApprovedBookings: number;
  totalEarnings: number;
  monthlyEarnings: Array<{ month: string; total: number }>;
}

export interface Service {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  location?: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  isActive: boolean;
  averageRating?: number;
  totalReviews?: number;
  reviews?: Array<{
    id: string | number;
    author: string;
    primaryUserName?: string;
    partnerName?: string;
    rating: number;
    review: string;
    createdAt: string;
  }>;
  createdAt?: string;
}

type RawService = {
  id?: string | number;
  name?: string;
  description?: string;
  price?: number | string;
  category?: string;
  location?: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  image_urls?: string[] | null;
  image_url?: string | null;
  image?: string | null;
  url?: string | null;
  isActive?: boolean | number | string;
  is_active?: boolean | number | string;
  averageRating?: number | string;
  average_rating?: number | string;
  totalReviews?: number | string;
  total_reviews?: number | string;
  reviews?: Array<{
    id?: string | number;
    author?: string;
    primaryUserName?: string;
    partnerName?: string;
    rating?: number | string;
    review?: string;
    comment?: string;
    createdAt?: string;
    date?: string;
  }>;
  createdAt?: string;
  created_at?: string;
};

export type BookingStatus = "pending" | "approved" | "in_progress" | "rejected" | "completed";

export interface Booking {
  id: string | number;
  requestId?: string;
  clientName: string;
  serviceId?: string;
  serviceName: string;
  location?: string;
  eventDate: string;
  eventTime?: string;
  guestCount?: number;
  notes?: string;
  status: BookingStatus;
  budget?: number;
  estimatedBudget?: number;
  allocatedBudget?: number;
  price?: number;
  totalAmount?: number;
  amount?: number;
  serviceAverageRating?: number;
  serviceTotalReviews?: number;
  latestReview?: {
    author?: string;
    primaryUserName?: string;
    partnerName?: string;
    rating?: number;
    review?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarningsData {
  totalEarnings?: number;
  total_earnings?: number;
  netTotalEarnings?: number;
  net_total_earnings?: number;
  thisMonth?: number;
  this_month?: number;
  netThisMonth?: number;
  net_this_month?: number;
  lastMonth?: number;
  last_month?: number;
  netLastMonth?: number;
  net_last_month?: number;
  totalSaved?: number;
  total_saved?: number;
  thisMonthSaved?: number;
  this_month_saved?: number;
  lastMonthSaved?: number;
  last_month_saved?: number;
  chartData?: Array<{ month: string; total: number }>;
  monthlyBreakdown?: Array<{ month: string; total: number }>;
  monthly_breakdown?: Array<{ month: string; total: number }>;
  netMonthlyBreakdown?: Array<{ month: string; total: number }>;
  net_monthly_breakdown?: Array<{ month: string; total: number }>;
  savedBreakdown?: Array<{ month: string; total: number }>;
  saved_breakdown?: Array<{ month: string; total: number }>;
  earnings?: Array<{
    amount?: number | string;
    savedAmount?: number | string;
    saved_amount?: number | string;
    paymentDate?: string;
    payment_date?: string;
    createdAt?: string;
    created_at?: string;
  }>;
  summary?: {
    total?: number | string;
    thisMonth?: number | string;
    this_month?: number | string;
    lastMonth?: number | string;
    last_month?: number | string;
  };
  earningsBasis?: string;
}

type VendorSession = {
  id?: string;
  name?: string;
  businessName?: string;
  email?: string;
  role?: string;
};

const EMPTY_PROFILE: VendorProfile = {
  businessName: "",
  ownerName: "",
  category: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  zipCode: "",
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

const normalizeBoolean = (value: unknown, fallback = true) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "active"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "inactive"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
};

const LOW_RES_WIDTH_KEYS = ["w", "width"];
const LOW_RES_HEIGHT_KEYS = ["h", "height"];
const DIRECT_IMAGE_PAGE_HOST_PATTERNS = [
  /(?:^|\.)facebook\.com$/i,
  /(?:^|\.)instagram\.com$/i,
  /(?:^|\.)pinterest\.com$/i,
  /(?:^|\.)twitter\.com$/i,
  /(?:^|\.)x\.com$/i,
];

const replaceGoogleHostedSizeSuffix = (value: string) =>
  value.replace(/=([sw]\d+|w\d+-h\d+(?:-[a-z0-9-]+)*)$/i, "=s1600");

const normalizeRemoteImageUrl = (value: string) => {
  const upgradedGoogleHostedUrl = replaceGoogleHostedSizeSuffix(value);

  try {
    const parsed = new URL(upgradedGoogleHostedUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "drive.google.com") {
      const fileId =
        parsed.searchParams.get("id") ||
        parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1];

      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    if (hostname.endsWith("dropbox.com")) {
      parsed.searchParams.delete("dl");
      parsed.searchParams.set("raw", "1");
    }

    let upgradedWidth = false;
    LOW_RES_WIDTH_KEYS.forEach((key) => {
      const rawValue = parsed.searchParams.get(key);
      const numericValue = Number(rawValue);
      if (Number.isFinite(numericValue) && numericValue > 0 && numericValue < 1200) {
        parsed.searchParams.set(key, "1600");
        upgradedWidth = true;
      }
    });

    LOW_RES_HEIGHT_KEYS.forEach((key) => {
      const rawValue = parsed.searchParams.get(key);
      const numericValue = Number(rawValue);
      if (upgradedWidth && Number.isFinite(numericValue) && numericValue > 0) {
        parsed.searchParams.delete(key);
      }
    });

    if (parsed.searchParams.has("blur")) {
      parsed.searchParams.delete("blur");
    }

    if (hostname === "images.unsplash.com") {
      const quality = Number(parsed.searchParams.get("q"));
      if (!Number.isFinite(quality) || quality < 80) {
        parsed.searchParams.set("q", "80");
      }
      if (!parsed.searchParams.get("auto")) {
        parsed.searchParams.set("auto", "format");
      }
      if (!parsed.searchParams.get("fit")) {
        parsed.searchParams.set("fit", "max");
      }
      if (!parsed.searchParams.get("w")) {
        parsed.searchParams.set("w", "1600");
      }
    }

    return parsed.toString();
  } catch {
    return upgradedGoogleHostedUrl;
  }
};

const toAbsoluteAssetUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return normalizeRemoteImageUrl(trimmed);
  }

  if (trimmed.startsWith("/")) {
    const base = String(api.defaults.baseURL || "").trim();
    if (/^https?:\/\//i.test(base)) {
      try {
        const parsed = new URL(base);
        return normalizeRemoteImageUrl(`${parsed.origin}${trimmed}`);
      } catch {
        return trimmed;
      }
    }
  }

  return trimmed;
};

const getImageUrlValidationMessage = (value: string) => {
  const normalized = toAbsoluteAssetUrl(value);
  if (!normalized) {
    return "Image URL is required.";
  }

  if (normalized.startsWith("/") || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return "";
  }

  try {
    const parsed = new URL(normalized);
    if (DIRECT_IMAGE_PAGE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
      return "Use a direct image file URL, not a social media page link.";
    }
  } catch {
    return "Enter a valid image URL.";
  }

  return "";
};

const normalizeService = (service: RawService): Service => {
  const resolvedImageUrls = Array.from(
    new Set(
      [
        ...(Array.isArray(service.imageUrls) ? service.imageUrls : []),
        ...(Array.isArray(service.image_urls) ? service.image_urls : []),
        service.imageUrl,
        service.image_url,
        service.image,
        service.url,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .map((value) => toAbsoluteAssetUrl(value)),
    ),
  );
  const resolvedImageUrl = resolvedImageUrls[0] || null;

  return {
    id: service.id ?? "",
    name: String(service.name || ""),
    description: String(service.description || ""),
    price: Number(service.price || 0),
    category: String(service.category || ""),
    location: String(service.location || ""),
    imageUrl: resolvedImageUrl,
    imageUrls: resolvedImageUrls,
    isActive: normalizeBoolean(service.isActive ?? service.is_active, true),
    averageRating: Number(service.averageRating || service.average_rating || 0),
    totalReviews: Number(service.totalReviews || service.total_reviews || 0),
    reviews: Array.isArray(service.reviews)
      ? service.reviews.map((review, index) => ({
          id: String(review.id ?? index + 1),
          author: String(review.author || "Client"),
          primaryUserName: String(review.primaryUserName || review.author || "Client"),
          partnerName: String(review.partnerName || ""),
          rating: Number(review.rating || 0),
          review: String(review.review || review.comment || ""),
          createdAt: String(review.createdAt || review.date || ""),
        }))
      : [],
    createdAt: String(service.createdAt || service.created_at || ""),
  };
};

const toUtcDate = (value: unknown) => {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const buildMonthlyBreakdownFromEntries = (
  entries: Array<{
    amount?: number | string;
    paymentDate?: string;
    payment_date?: string;
    createdAt?: string;
    created_at?: string;
  }>,
) => {
  const totals = new Map<string, number>();

  entries.forEach((entry) => {
    const amount = Number(entry.amount || 0);
    if (!(amount > 0)) {
      return;
    }

    const parsedDate = toUtcDate(
      entry.paymentDate || entry.payment_date || entry.createdAt || entry.created_at,
    );
    if (!parsedDate) {
      return;
    }

    const monthLabel = parsedDate.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    totals.set(monthLabel, (totals.get(monthLabel) || 0) + amount);
  });

  const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthOrder
    .filter((month) => totals.has(month))
    .map((month) => ({ month, total: Number((totals.get(month) || 0).toFixed(2)) }));
};

const buildMonthTotalsFromEntries = (
  entries: Array<{
    amount?: number | string;
    paymentDate?: string;
    payment_date?: string;
    createdAt?: string;
    created_at?: string;
  }>,
) => {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let total = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  entries.forEach((entry) => {
    const amount = Number(entry.amount || 0);
    if (!(amount > 0)) {
      return;
    }

    total += amount;
    const parsedDate = toUtcDate(
      entry.paymentDate || entry.payment_date || entry.createdAt || entry.created_at,
    );
    if (!parsedDate) {
      return;
    }

    const entryMonth = parsedDate.getUTCMonth();
    const entryYear = parsedDate.getUTCFullYear();
    if (entryMonth === currentMonth && entryYear === currentYear) {
      thisMonth += amount;
      return;
    }

    if (entryMonth === previousMonth && entryYear === previousMonthYear) {
      lastMonth += amount;
    }
  });

  return {
    total: Number(total.toFixed(2)),
    thisMonth: Number(thisMonth.toFixed(2)),
    lastMonth: Number(lastMonth.toFixed(2)),
  };
};

const getVendorSession = (): VendorSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawVendor = sessionStorage.getItem("vendor");
  if (!rawVendor) {
    return null;
  }

  try {
    return JSON.parse(rawVendor) as VendorSession;
  } catch {
    return null;
  }
};

const persistVendorSession = (profile: Partial<VendorProfile>) => {
  if (typeof window === "undefined") {
    return;
  }

  const existingSession = getVendorSession() || {};
  const businessName =
    profile.businessName?.trim() || existingSession.businessName || existingSession.name || "Vendor";
  const email = (profile.email || existingSession.email || "").trim().toLowerCase();

  sessionStorage.setItem(
    "vendor",
    JSON.stringify({
      ...existingSession,
      name: businessName,
      businessName,
      email,
      role: existingSession.role || "vendor",
    }),
  );
};

const getVendorIdentity = (overrides?: { id?: string; email?: string }) => {
  const session = getVendorSession();
  const vendorId = String(overrides?.id ?? session?.id ?? "").trim();
  const email = String(overrides?.email ?? session?.email ?? "")
    .trim()
    .toLowerCase();

  return {
    vendorId,
    email,
  };
};

const buildParams = (identity: ReturnType<typeof getVendorIdentity>) => {
  const params: Record<string, string> = {};

  if (identity.vendorId) {
    params.vendorId = identity.vendorId;
  }

  if (identity.email) {
    params.email = identity.email;
  }

  return params;
};

const fetchProfile = async (overrides?: { id?: string; email?: string }) => {
  const identity = getVendorIdentity(overrides);
  const { data } = await api.get<Partial<VendorProfile>>("/vendor/profile", {
    params: buildParams(identity),
  });

  const profile: VendorProfile = {
    ...EMPTY_PROFILE,
    ...data,
    email: (data.email || identity.email || "").trim().toLowerCase(),
  };

  persistVendorSession(profile);
  return profile;
};

const getVendorIdOrThrow = () => {
  const { vendorId } = getVendorIdentity();
  if (!vendorId) {
    throw new Error("Vendor ID is required. Please log in again.");
  }

  return vendorId;
};

export async function getProfile() {
  try {
    return await fetchProfile();
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load vendor profile."));
  }
}

export async function updateProfile(data: Partial<VendorProfile>) {
  const session = getVendorSession();
  const payload: VendorProfile = {
    ...EMPTY_PROFILE,
    ...data,
    email: String(data.email || session?.email || "")
      .trim()
      .toLowerCase(),
  };

  if (!payload.email) {
    throw new Error("Vendor email is required to save profile.");
  }

  try {
    await api.put("/vendor/profile", payload);
    const refreshedProfile = await fetchProfile({
      id: session?.id,
      email: payload.email,
    });
    persistVendorSession(refreshedProfile);
    return refreshedProfile;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to save vendor profile."));
  }
}

export async function getStats() {
  try {
    const { data } = await api.get<Partial<VendorStats>>("/vendor/stats", {
      params: buildParams(getVendorIdentity()),
    });

    return {
      totalBookings: Number(data.totalBookings || 0),
      pendingBookings: Number(data.pendingBookings || 0),
      approvedBookings: Number(data.approvedBookings || 0),
      currentMonthBookings: Number(data.currentMonthBookings || 0),
      lastMonthBookings: Number(data.lastMonthBookings || 0),
      currentMonthApprovedBookings: Number(data.currentMonthApprovedBookings || 0),
      lastMonthApprovedBookings: Number(data.lastMonthApprovedBookings || 0),
      totalEarnings: Number(data.totalEarnings || 0),
      monthlyEarnings: Array.isArray(data.monthlyEarnings) ? data.monthlyEarnings : [],
    } satisfies VendorStats;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load vendor stats."));
  }
}

export async function getServices() {
  try {
    const { data } = await api.get<RawService[]>("/services", {
      params: { vendorId: getVendorIdOrThrow() },
    });

    return Array.isArray(data) ? data.map((service) => normalizeService(service)) : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load services."));
  }
}

export async function getRecentBookings() {
  try {
    const { data } = await api.get<Booking[]>("/bookings/recent", {
      params: { vendorId: getVendorIdOrThrow() },
    });

    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load bookings."));
  }
}

export async function updateBookingStatus(id: string | number, status: BookingStatus) {
  try {
    const { data } = await api.patch<Booking>(`/bookings/${id}/status`, { status });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update booking status."));
  }
}

export async function getEarnings() {
  try {
    const { data } = await api.get<EarningsData>("/earnings", {
      params: { vendorId: getVendorIdOrThrow() },
    });

    const workerEntries = Array.isArray(data.earnings) ? data.earnings : [];
    const derivedTotals = buildMonthTotalsFromEntries(workerEntries);
    const chartData = Array.isArray(data.netMonthlyBreakdown)
      ? data.netMonthlyBreakdown
      : Array.isArray(data.net_monthly_breakdown)
        ? data.net_monthly_breakdown
        : Array.isArray(data.chartData)
          ? data.chartData
          : Array.isArray(data.monthlyBreakdown)
            ? data.monthlyBreakdown
            : Array.isArray(data.monthly_breakdown)
              ? data.monthly_breakdown
              : buildMonthlyBreakdownFromEntries(workerEntries);

    return {
      totalEarnings: Number(
        data.netTotalEarnings ||
          data.net_total_earnings ||
          data.totalEarnings ||
          data.total_earnings ||
          data.summary?.total ||
          derivedTotals.total ||
          0,
      ),
      thisMonth: Number(
        data.netThisMonth ||
          data.net_this_month ||
          data.thisMonth ||
          data.this_month ||
          data.summary?.thisMonth ||
          data.summary?.this_month ||
          derivedTotals.thisMonth ||
          0,
      ),
      lastMonth: Number(
        data.netLastMonth ||
          data.net_last_month ||
          data.lastMonth ||
          data.last_month ||
          data.summary?.lastMonth ||
          data.summary?.last_month ||
          derivedTotals.lastMonth ||
          0,
      ),
      totalSaved: Number(
        data.totalSaved ||
          data.total_saved ||
          0,
      ),
      thisMonthSaved: Number(
        data.thisMonthSaved ||
          data.this_month_saved ||
          0,
      ),
      lastMonthSaved: Number(
        data.lastMonthSaved ||
          data.last_month_saved ||
          0,
      ),
      chartData,
      monthlyBreakdown: chartData,
      savedBreakdown: Array.isArray(data.savedBreakdown)
        ? data.savedBreakdown
        : Array.isArray(data.saved_breakdown)
          ? data.saved_breakdown
          : [],
      earningsBasis: String(data.earningsBasis || "recorded"),
    } satisfies EarningsData;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load earnings."));
  }
}

export async function createService(data: Omit<Service, "id" | "createdAt">) {
  try {
    const imageUrls = Array.from(
      new Set(
        (Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl || ""])
          .map((value) => toAbsoluteAssetUrl(String(value || "")))
          .filter(Boolean),
      ),
    ).slice(0, 3);
    const invalidImageUrlMessage = imageUrls
      .map((value) => getImageUrlValidationMessage(value))
      .find(Boolean);
    if (invalidImageUrlMessage) {
      throw new Error(invalidImageUrlMessage);
    }
    const imageUrl = imageUrls[0] || null;
    const { data: response } = await api.post("/services", {
      ...data,
      imageUrl,
      imageUrls,
      vendorId: getVendorIdOrThrow(),
    });
    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create service."));
  }
}

export async function updateService(
  id: string | number,
  data: Partial<Omit<Service, "id" | "createdAt">>,
) {
  try {
    const normalizedImageUrls = data.imageUrls === undefined && data.imageUrl === undefined
      ? undefined
      : Array.from(
          new Set(
            (Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl || ""])
              .map((value) => toAbsoluteAssetUrl(String(value || "")))
              .filter(Boolean),
          ),
        ).slice(0, 3);
    const invalidImageUrlMessage = (normalizedImageUrls || [])
      .map((value) => getImageUrlValidationMessage(value))
      .find(Boolean);
    if (invalidImageUrlMessage) {
      throw new Error(invalidImageUrlMessage);
    }
    const imageUrl =
      normalizedImageUrls === undefined ? undefined : normalizedImageUrls[0] || null;

    const { data: response } = await api.put(`/services/${id}`, {
      ...data,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(normalizedImageUrls !== undefined ? { imageUrls: normalizedImageUrls } : {}),
      vendorId: getVendorIdOrThrow(),
    });
    return response;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update service."));
  }
}

export async function deleteService(id: string | number) {
  try {
    const { data } = await api.delete(`/services/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete service."));
  }
}
