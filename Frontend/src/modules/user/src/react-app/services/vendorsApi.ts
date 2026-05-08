import { isAxiosError } from "axios";

import api from "@/api/axios";

export interface VendorReview {
  id: string | number;
  author: string;
  userName: string;
  primaryUserName: string;
  partnerName: string;
  rating: number;
  date: string;
  createdAt: string;
  comment: string;
  review: string;
  isMine?: boolean;
}

export interface VendorContact {
  phone: string;
  email: string;
}

export interface VendorRecommendation {
  id: string | number;
  serviceId: string | number;
  vendorId: string | number;
  name: string;
  vendorName: string;
  businessName: string;
  service: string;
  serviceName: string;
  price: number;
  rating: number;
  averageRating: number;
  totalReviews: number;
  vendorAverageRating?: number;
  vendorTotalReviews?: number;
  location: string;
  image: string;
  description: string;
  portfolio: string[];
  reviews: VendorReview[];
  contact: VendorContact;
  features: string[];
  availability: string;
}

export type VendorRecommendationSort = "price" | "relevance";

export interface VendorRecommendationQuery {
  selectedServices: string[];
  budget: number;
  location: string;
  sortBy?: VendorRecommendationSort;
}

export interface VendorRecommendationResult {
  recommendations: VendorRecommendation[];
  groups: VendorRecommendationGroup[];
  count: number;
  message: string;
  totalBudget: number;
  allocationStrategy: string;
  estimatedMinimumTotal: number;
  matchedServiceCount: number;
  location: string;
}

export interface VendorRecommendationGroup {
  service: string;
  allocatedBudget: number;
  count: number;
  cheapestPrice: number;
  recommendations: VendorRecommendation[];
}

export interface VendorInquiryPayload {
  name: string;
  email: string;
  userEmail?: string;
  serviceId?: string | number;
  phone?: string;
  weddingDate?: string;
  budget?: number;
  allocatedBudget?: number;
  location?: string;
  guestCount?: number;
  serviceType?: string;
  message: string;
}

export type VendorApiResponse = {
  id?: string | number;
  serviceId?: string | number;
  vendorId?: string | number;
  name?: string;
  vendorName?: string;
  vendor_name?: string;
  businessName?: string;
  business_name?: string;
  service?: string;
  serviceName?: string;
  service_name?: string;
  category?: string;
  price?: number;
  rating?: number;
  location?: string;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  url?: string;
  description?: string;
  portfolio?: Array<string | { image?: string; imageUrl?: string; image_url?: string; url?: string }>;
  reviews?: Array<{
    id?: string | number;
    author?: string;
    userName?: string;
    primaryUserName?: string;
    partnerName?: string;
    rating?: number;
    date?: string;
    createdAt?: string;
    comment?: string;
    review?: string;
    isMine?: boolean;
  }>;
  averageRating?: number;
  average_rating?: number;
  totalReviews?: number;
  total_reviews?: number;
  vendorAverageRating?: number;
  vendor_average_rating?: number;
  vendorTotalReviews?: number;
  vendor_total_reviews?: number;
  contact?: {
    phone?: string;
    email?: string;
  };
  features?: string[];
  availability?: string;
};

type VendorRecommendationApiResponse =
  | VendorApiResponse[]
  | {
      success?: boolean;
      count?: number;
      message?: string;
      totalBudget?: number;
      total_budget?: number;
      allocationStrategy?: string;
      allocation_strategy?: string;
      estimatedMinimumTotal?: number;
      estimated_minimum_total?: number;
      matchedServiceCount?: number;
      matched_service_count?: number;
      location?: string;
      recommendations?: VendorApiResponse[];
      services?: VendorApiResponse[];
      vendors?: VendorApiResponse[];
      results?: VendorApiResponse[];
      groupedRecommendations?: Array<{
        service?: string;
        allocatedBudget?: number;
        allocated_budget?: number;
        count?: number;
        cheapestPrice?: number;
        cheapest_price?: number;
        recommendations?: VendorApiResponse[];
      }>;
      grouped_recommendations?: Array<{
        service?: string;
        allocatedBudget?: number;
        allocated_budget?: number;
        count?: number;
        cheapestPrice?: number;
        cheapest_price?: number;
        recommendations?: VendorApiResponse[];
      }>;
    };

const toAbsoluteAssetUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const replaceGoogleHostedSizeSuffix = (input: string) =>
    input.replace(/=([sw]\d+|w\d+-h\d+(?:-[a-z0-9-]+)*)$/i, "=s1600");

  const normalizeRemoteImageUrl = (input: string) => {
    const upgradedGoogleHostedUrl = replaceGoogleHostedSizeSuffix(input);

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

      const width = Number(parsed.searchParams.get("w") || parsed.searchParams.get("width"));
      if (Number.isFinite(width) && width > 0 && width < 1200) {
        if (parsed.searchParams.has("w")) {
          parsed.searchParams.set("w", "1600");
        }
        if (parsed.searchParams.has("width")) {
          parsed.searchParams.set("width", "1600");
        }
        parsed.searchParams.delete("h");
        parsed.searchParams.delete("height");
      }

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

const SERVICE_KEYWORDS: Record<string, string[]> = {
  venue: ["venue", "banquet", "hall"],
  catering: ["catering", "caterer", "food"],
  photography: ["photography", "photographer"],
  decoration: ["decoration", "decor"],
  makeup: ["makeup", "styling", "hair"],
  music: ["music", "dj", "band"],
  entry: ["entry", "entry style", "walking on clouds", "piro"],
  invitation: ["invitation", "invitations", "digital", "physical"],
  flowers: ["flower", "florist", "floral"],
  transportation: ["transportation", "transport", "car"],
  cake: ["cake", "bakery"],
};

const normalizeService = (value: string): string => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  for (const [serviceId, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return serviceId;
    }
  }

  return normalized;
};

const normalizePortfolioImages = (
  portfolio: VendorApiResponse["portfolio"],
  fallbackImage: string,
) => {
  const resolvedImages = (Array.isArray(portfolio) ? portfolio : [])
    .map((item) => {
      if (typeof item === "string") {
        return toAbsoluteAssetUrl(item);
      }

      if (item && typeof item === "object") {
        return toAbsoluteAssetUrl(
          String(item.image || item.imageUrl || item.image_url || item.url || ""),
        );
      }

      return "";
    })
    .filter(Boolean);

  const uniqueImages = Array.from(new Set([fallbackImage, ...resolvedImages].filter(Boolean)));
  return uniqueImages;
};

export const toVendorModel = (vendor: VendorApiResponse, index: number): VendorRecommendation => {
  const fallbackImage = "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800";
  const resolvedImage = toAbsoluteAssetUrl(
    String(vendor.image || vendor.imageUrl || vendor.image_url || vendor.url || ""),
  );
  const image = resolvedImage || fallbackImage;
  const id = String(vendor.id ?? "").trim() || `service-${index + 1}`;
  const serviceId = String(vendor.serviceId ?? vendor.id ?? "").trim() || id;
  const vendorId = String(vendor.vendorId ?? vendor.id ?? "").trim() || id;
  const portfolio = normalizePortfolioImages(vendor.portfolio, image);
  const averageRating = Number(
    vendor.averageRating ?? vendor.average_rating ?? vendor.rating ?? 0,
  );
  const vendorName = String(
    vendor.vendorName || vendor.vendor_name || vendor.name || "",
  ).trim();
  const serviceName = String(
    vendor.serviceName || vendor.service_name || vendor.service || vendor.category || "",
  ).trim();
  const businessName = String(
    vendor.businessName || vendor.business_name || serviceName || vendorName || "Service",
  ).trim();
  const reviews = Array.isArray(vendor.reviews)
    ? vendor.reviews.map((review, reviewIndex) => {
        const reviewText = String(review.review || review.comment || "");
        const createdAt = String(review.createdAt || review.date || "");

        return {
          id: String(review.id ?? reviewIndex + 1),
          author: String(review.author || review.userName || "Client"),
          userName: String(review.userName || review.author || "Client"),
          primaryUserName: String(
            review.primaryUserName || review.userName || review.author || "Client",
          ),
          partnerName: String(review.partnerName || ""),
          rating: Number(review.rating || 5),
          date: createdAt,
          createdAt,
          comment: reviewText,
          review: reviewText,
          isMine: Boolean(review.isMine),
        };
      })
    : [];
  const totalReviews = Number(
    vendor.totalReviews ?? vendor.total_reviews ?? reviews.length ?? 0,
  );

  return {
    id,
    serviceId,
    vendorId,
    name: vendorName || businessName,
    vendorName: vendorName || businessName,
    businessName,
    service: normalizeService(String(vendor.service || vendor.category || "")),
    serviceName: serviceName || businessName,
    price: Number(vendor.price || 0),
    rating: averageRating,
    averageRating,
    totalReviews,
    vendorAverageRating: Number(
      vendor.vendorAverageRating ?? vendor.vendor_average_rating ?? averageRating,
    ),
    vendorTotalReviews: Number(
      vendor.vendorTotalReviews ?? vendor.vendor_total_reviews ?? totalReviews,
    ),
    location: String(vendor.location || ""),
    image,
    description: String(vendor.description || "Trusted wedding service provider."),
    portfolio,
    reviews,
    contact: {
      phone: String(vendor.contact?.phone || ""),
      email: String(vendor.contact?.email || ""),
    },
    features: Array.isArray(vendor.features) ? vendor.features : [],
    availability: String(vendor.availability || "Contact for availability"),
  };
};

const buildRecommendationKey = (vendor: VendorRecommendation) => {
  const serviceId = String(vendor.serviceId || vendor.id || "").trim();
  if (serviceId) {
    return `service:${serviceId}`;
  }

  const vendorId = String(vendor.vendorId || "").trim();
  const serviceName = String(vendor.serviceName || vendor.businessName || vendor.service || "").trim().toLowerCase();
  const location = String(vendor.location || "").trim().toLowerCase();
  return `vendor:${vendorId}|service:${serviceName}|price:${vendor.price}|location:${location}`;
};

const dedupeVendorRecommendations = (vendors: VendorRecommendation[]) => {
  const uniqueVendors = new Map<string, VendorRecommendation>();
  vendors.forEach((vendor) => {
    const key = buildRecommendationKey(vendor);
    if (!uniqueVendors.has(key)) {
      uniqueVendors.set(key, vendor);
    }
  });

  return Array.from(uniqueVendors.values());
};

const toRecommendationGroup = (
  group: NonNullable<
    Exclude<VendorRecommendationApiResponse, VendorApiResponse[]>["groupedRecommendations"]
  >[number],
): VendorRecommendationGroup => {
  const rawRecommendations = Array.isArray(group.recommendations) ? group.recommendations : [];
  const recommendations = dedupeVendorRecommendations(
    rawRecommendations.map((vendor, index) => toVendorModel(vendor, index)),
  );

  return {
    service: normalizeService(String(group.service || "")),
    allocatedBudget: Number(group.allocatedBudget ?? group.allocated_budget ?? 0),
    count: Number(group.count ?? recommendations.length),
    cheapestPrice: Number(group.cheapestPrice ?? group.cheapest_price ?? 0),
    recommendations,
  };
};

type BusinessLabelCandidate = {
  businessName?: string;
  serviceName?: string;
  name?: string;
  vendorName?: string;
};

export const getBusinessDisplayName = (value: BusinessLabelCandidate) =>
  String(value.businessName || value.serviceName || value.name || "Service").trim() || "Service";

export const getVendorByline = (
  value: BusinessLabelCandidate,
  prefix = "Provided by",
) => {
  const vendorName = String(value.vendorName || value.name || "").trim();
  return vendorName ? `${prefix} ${vendorName}` : "";
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

export async function getRecommendedVendors({
  selectedServices,
  budget,
  location,
  sortBy = "price",
}: VendorRecommendationQuery): Promise<VendorRecommendationResult> {
  const normalizedServices = selectedServices.map((service) => String(service || "").trim()).filter(Boolean);
  const normalizedLocation = String(location || "").trim();
  const normalizedBudget = Number(budget || 0);

  if (normalizedServices.length === 0) {
    throw new Error("Select at least one service.");
  }

  if (!Number.isFinite(normalizedBudget) || normalizedBudget <= 0) {
    throw new Error("Enter a valid budget greater than zero.");
  }

  if (!normalizedLocation) {
    throw new Error("Enter the event location.");
  }

  try {
    const { data } = await api.get<VendorRecommendationApiResponse>("/vendors/recommend", {
      params: {
        service: normalizedServices.join(","),
        budget: normalizedBudget,
        location: normalizedLocation,
        sortBy,
      },
    });

    const recommendationItems = Array.isArray(data)
      ? data
      : data.recommendations || data.services || data.vendors || data.results || [];
    const recommendations = dedupeVendorRecommendations(
      recommendationItems.map((vendor, index) => toVendorModel(vendor, index)),
    );
    const rawGroups = Array.isArray(data)
      ? []
      : data.groupedRecommendations || data.grouped_recommendations || [];
    const groups = rawGroups.map((group) => toRecommendationGroup(group));
    const message =
      (Array.isArray(data) ? "" : String(data.message || "").trim()) ||
      (recommendations.length > 0
        ? `Found ${recommendations.length} matching vendor service${recommendations.length === 1 ? "" : "s"}.`
        : "No vendor services found for your filters.");

    return {
      recommendations,
      groups,
      count: Array.isArray(data) ? recommendations.length : Number(data.count || recommendations.length),
      message,
      totalBudget: Array.isArray(data) ? normalizedBudget : Number(data.totalBudget ?? data.total_budget ?? normalizedBudget),
      allocationStrategy: Array.isArray(data)
        ? "equal"
        : String(data.allocationStrategy || data.allocation_strategy || "weighted"),
      estimatedMinimumTotal: Array.isArray(data)
        ? 0
        : Number(data.estimatedMinimumTotal ?? data.estimated_minimum_total ?? 0),
      matchedServiceCount: Array.isArray(data)
        ? groups.filter((group) => group.recommendations.length > 0).length
        : Number(data.matchedServiceCount ?? data.matched_service_count ?? groups.filter((group) => group.recommendations.length > 0).length),
      location: Array.isArray(data) ? normalizedLocation : String(data.location || normalizedLocation),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch vendor recommendations."));
  }
}

export async function getVendorDetails(vendorId: string | number) {
  const normalizedVendorId = String(vendorId || "").trim();
  if (!normalizedVendorId) {
    throw new Error("Vendor id is required.");
  }

  try {
    const { data } = await api.get<VendorApiResponse>(`/vendors/${normalizedVendorId}`);
    return toVendorModel(data || {}, 0);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to fetch vendor details."));
  }
}

export async function createVendorInquiry(vendorId: string | number, payload: VendorInquiryPayload) {
  const normalizedVendorId = String(vendorId || "").trim();
  if (!normalizedVendorId) {
    throw new Error("Vendor id is required.");
  }

  try {
    const { data } = await api.post<{ success?: boolean; message?: string }>(
      `/vendors/${normalizedVendorId}/inquiries`,
      {
        name: payload.name,
        email: payload.email,
        userEmail: String(payload.userEmail || payload.email || "").trim().toLowerCase(),
        serviceId: String(payload.serviceId || "").trim(),
        phone: payload.phone || "",
        weddingDate: payload.weddingDate || "",
        budget: Number(payload.budget || 0),
        allocatedBudget: Number(payload.allocatedBudget || payload.budget || 0),
        location: String(payload.location || "").trim(),
        guestCount: Number(payload.guestCount || 0),
        serviceType: String(payload.serviceType || "").trim(),
        message: payload.message,
      },
    );
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to send inquiry."));
  }
}

export function getServiceLabel(serviceId: string): string {
  const normalized = normalizeService(serviceId);
  const labels: Record<string, string> = {
    venue: "Venue",
    catering: "Catering",
    photography: "Photography",
    decoration: "Decoration",
    makeup: "Makeup & Styling",
    music: "Music & DJ",
    entry: "Entry Style",
    invitation: "Invitation",
    flowers: "Flowers",
    transportation: "Transportation",
    cake: "Wedding Cake",
  };

  return labels[normalized] || serviceId;
}
