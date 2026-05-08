export type VendorRatingRecord = {
  bookingId: string;
  vendorId: string;
  vendorName: string;
  serviceName: string;
  userName: string;
  userEmail: string;
  rating: number;
  review: string;
  updatedAt: string;
};

export type VendorRatingFilter = {
  vendorId?: string | number;
  vendorName?: string;
  serviceName?: string;
};

export type VendorRatingAverage = {
  averageRating: number;
  totalRatings: number;
};

const STORAGE_KEY = "elegance_vendor_ratings";

const normalizeBookingId = (value: string | number) => String(value || "").trim();
const normalizeLookupValue = (value: string | number | undefined) =>
  String(value || "").trim().toLowerCase();

const sanitizeRating = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const rounded = Math.round(value);
  return Math.max(1, Math.min(5, rounded));
};

const toRecord = (value: Partial<VendorRatingRecord>): VendorRatingRecord | null => {
  const bookingId = normalizeBookingId(value.bookingId || "");
  if (!bookingId) {
    return null;
  }

  return {
    bookingId,
    vendorId: String(value.vendorId || "").trim(),
    vendorName: String(value.vendorName || "").trim(),
    serviceName: String(value.serviceName || "").trim(),
    userName: String(value.userName || "").trim(),
    userEmail: String(value.userEmail || "").trim().toLowerCase(),
    rating: sanitizeRating(Number(value.rating || 0)),
    review: String(value.review || "").trim(),
    updatedAt: String(value.updatedAt || ""),
  };
};

export const getVendorRatings = (): VendorRatingRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VendorRatingRecord>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => toRecord(item))
      .filter((item): item is VendorRatingRecord => Boolean(item));
  } catch {
    return [];
  }
};

export const getVendorRatingByBookingId = (
  bookingId: string | number,
): VendorRatingRecord | null => {
  const normalizedId = normalizeBookingId(bookingId);
  if (!normalizedId) {
    return null;
  }

  return getVendorRatings().find((item) => item.bookingId === normalizedId) || null;
};

export const upsertVendorRating = (value: Partial<VendorRatingRecord>) => {
  if (typeof window === "undefined") {
    return null;
  }

  const nextRecord = toRecord({
    ...value,
    updatedAt: new Date().toISOString(),
  });
  if (!nextRecord) {
    return null;
  }

  const current = getVendorRatings();
  const remaining = current.filter((item) => item.bookingId !== nextRecord.bookingId);
  const next = [nextRecord, ...remaining];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return nextRecord;
};

const collectMatchingRatings = (
  ratings: VendorRatingRecord[],
  filter: VendorRatingFilter,
): VendorRatingRecord[] => {
  const vendorId = normalizeLookupValue(filter.vendorId);
  const vendorName = normalizeLookupValue(filter.vendorName);
  const serviceName = normalizeLookupValue(filter.serviceName);

  if (!vendorId && !vendorName && !serviceName) {
    return [];
  }

  if (vendorId) {
    const byVendorId = ratings.filter((rating) => {
      if (normalizeLookupValue(rating.vendorId) !== vendorId) {
        return false;
      }

      if (serviceName && normalizeLookupValue(rating.serviceName) !== serviceName) {
        return false;
      }

      return true;
    });

    if (byVendorId.length > 0) {
      return byVendorId;
    }
  }

  return ratings.filter((rating) => {
    if (vendorName && normalizeLookupValue(rating.vendorName) !== vendorName) {
      return false;
    }

    if (serviceName && normalizeLookupValue(rating.serviceName) !== serviceName) {
      return false;
    }

    return true;
  });
};

export const getVendorAverageRatingFromRecords = (
  ratings: VendorRatingRecord[],
  filter: VendorRatingFilter,
): VendorRatingAverage => {
  const matchingRatings = collectMatchingRatings(ratings, filter);
  if (matchingRatings.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
    };
  }

  const total = matchingRatings.reduce((sum, item) => sum + sanitizeRating(item.rating), 0);
  const average = total / matchingRatings.length;

  return {
    averageRating: Math.round(average * 10) / 10,
    totalRatings: matchingRatings.length,
  };
};

export const getVendorAverageRating = (filter: VendorRatingFilter): VendorRatingAverage =>
  getVendorAverageRatingFromRecords(getVendorRatings(), filter);
