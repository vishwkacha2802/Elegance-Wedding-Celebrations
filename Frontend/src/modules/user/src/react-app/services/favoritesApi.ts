import { isAxiosError } from "axios";

import api from "@/api/axios";
import {
  type VendorApiResponse,
  type VendorRecommendation,
  toVendorModel,
} from "@user/react-app/services/vendorsApi";

export interface FavoriteService extends VendorRecommendation {
  favoriteId: string;
  savedAt: string;
  isFavorite: boolean;
}

type RawFavoriteService = VendorApiResponse & {
  favoriteId?: string | number;
  savedAt?: string;
  isFavorite?: boolean;
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

const toFavoriteService = (favorite: RawFavoriteService, index: number): FavoriteService => {
  const vendorModel = toVendorModel(favorite, index);

  return {
    ...vendorModel,
    favoriteId: String(favorite.favoriteId || `${vendorModel.serviceId}`),
    savedAt: String(favorite.savedAt || ""),
    isFavorite: favorite.isFavorite !== false,
  };
};

export async function fetchFavoriteServices(userEmail: string): Promise<FavoriteService[]> {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("User email is required.");
  }

  try {
    const { data } = await api.get<{ favorites?: RawFavoriteService[] } | RawFavoriteService[]>(
      "/user/favorites",
      {
        params: { userEmail: normalizedEmail },
      },
    );

    const favorites = Array.isArray(data) ? data : Array.isArray(data?.favorites) ? data.favorites : [];
    return favorites.map((favorite, index) => toFavoriteService(favorite, index));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load favorite services."));
  }
}

export async function addFavoriteService(payload: {
  userEmail: string;
  serviceId: string | number;
  vendorId?: string | number;
}): Promise<FavoriteService | null> {
  const normalizedEmail = String(payload.userEmail || "").trim().toLowerCase();
  const serviceId = String(payload.serviceId || "").trim();
  if (!normalizedEmail || !serviceId) {
    throw new Error("User email and service id are required.");
  }

  try {
    const { data } = await api.post<{ favorite?: RawFavoriteService | null; success?: boolean }>(
      "/user/favorites",
      {
        userEmail: normalizedEmail,
        serviceId,
        vendorId: String(payload.vendorId || "").trim(),
      },
    );

    return data.favorite ? toFavoriteService(data.favorite, 0) : null;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to save favorite service."));
  }
}

export async function removeFavoriteService(payload: {
  userEmail: string;
  serviceId: string | number;
}): Promise<{ success: boolean; serviceId: string }> {
  const normalizedEmail = String(payload.userEmail || "").trim().toLowerCase();
  const serviceId = String(payload.serviceId || "").trim();
  if (!normalizedEmail || !serviceId) {
    throw new Error("User email and service id are required.");
  }

  try {
    const { data } = await api.delete<{ success?: boolean; serviceId?: string }>(
      `/user/favorites/${serviceId}`,
      {
        params: { userEmail: normalizedEmail },
      },
    );

    return {
      success: Boolean(data.success),
      serviceId: String(data.serviceId || serviceId),
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to remove favorite service."));
  }
}
