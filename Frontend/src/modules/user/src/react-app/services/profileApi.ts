import { isAxiosError } from "axios";
import api from "@/api/axios";

export type CouplePartnerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type CoupleProfile = {
  accountEmail: string;
  editorEmail?: string;
  canEditBothProfiles?: boolean;
  editableProfileType?: "bride" | "groom" | "";
  bride: CouplePartnerProfile;
  groom: CouplePartnerProfile;
};

const normalizeEmail = (value: string) => String(value || "").trim().toLowerCase();

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

const toPartnerProfile = (
  data: Partial<CouplePartnerProfile> | undefined,
  accountEmail: string,
): CouplePartnerProfile => {
  return {
    firstName: String(data?.firstName || "").trim(),
    lastName: String(data?.lastName || "").trim(),
    email: normalizeEmail(data?.email || accountEmail),
    phone: String(data?.phone || "").trim(),
  };
};

const toCoupleProfile = (
  data: Partial<CoupleProfile> | undefined,
  accountEmail: string,
): CoupleProfile => {
  const normalizedEmail = normalizeEmail(accountEmail);
  const normalizedAccountEmail = normalizeEmail(data?.accountEmail || normalizedEmail);
  return {
    accountEmail: normalizedAccountEmail,
    editorEmail: normalizeEmail(data?.editorEmail || ""),
    canEditBothProfiles: Boolean(data?.canEditBothProfiles),
    editableProfileType:
      data?.editableProfileType === "bride" || data?.editableProfileType === "groom"
        ? data.editableProfileType
        : "",
    bride: toPartnerProfile(data?.bride, normalizedAccountEmail),
    groom: toPartnerProfile(data?.groom, normalizedAccountEmail),
  };
};

export async function getCoupleProfile(accountEmail: string) {
  const normalizedEmail = normalizeEmail(accountEmail);
  if (!normalizedEmail) {
    throw new Error("User account email is required.");
  }

  try {
    const { data } = await api.get<Partial<CoupleProfile>>("/user/couple-profile", {
      params: {
        accountEmail: normalizedEmail,
      },
    });

    return toCoupleProfile(data, normalizedEmail);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load couple profile."));
  }
}

export async function updateCoupleProfile(profile: CoupleProfile) {
  const normalizedAccountEmail = normalizeEmail(profile.accountEmail);
  const normalizedEditorEmail = normalizeEmail(profile.editorEmail || "");
  if (!normalizedAccountEmail) {
    throw new Error("User account email is required.");
  }

  const payload: CoupleProfile = {
    accountEmail: normalizedAccountEmail,
    editorEmail: normalizedEditorEmail,
    bride: toPartnerProfile(profile.bride, normalizedAccountEmail),
    groom: toPartnerProfile(profile.groom, normalizedAccountEmail),
  };

  try {
    const { data } = await api.put<{ success?: boolean; profile?: Partial<CoupleProfile> }>(
      "/user/couple-profile",
      payload,
    );
    return toCoupleProfile(data?.profile, normalizedAccountEmail);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to save couple profile."));
  }
}
